import type { PrismaClient } from "@/generated/prisma/client";
import type { TenantDb, TenantTx } from "@/server/tenant-db";
import type {
  CalendarBlockRecord,
  CreateCalendarBlockData,
  ScheduleOwner,
  ScheduleRepositories,
  WeeklySlotInput,
} from "@/modules/tenant-config/application/ports/schedule-repository";

type DbClient = Pick<TenantTx, "branch" | "professional">;

const weeklySelect = {
  id: true,
  tenantId: true,
  branchId: true,
  professionalId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  capacity: true,
} as const;

const blockSelect = {
  id: true,
  tenantId: true,
  branchId: true,
  professionalId: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  reason: true,
} as const;

function ownerWhere(tenantId: string, owner: ScheduleOwner) {
  if (owner.kind === "branch") {
    return { tenantId, branchId: owner.id, professionalId: null };
  }
  return { tenantId, professionalId: owner.id, branchId: null };
}

function ownerCreateData(tenantId: string, owner: ScheduleOwner) {
  if (owner.kind === "branch") {
    return { tenantId, branchId: owner.id, professionalId: null };
  }
  return { tenantId, professionalId: owner.id, branchId: null };
}

async function ownerExists(db: DbClient, tenantId: string, owner: ScheduleOwner): Promise<boolean> {
  if (owner.kind === "branch") {
    const branch = await db.branch.findFirst({
      where: { tenantId, id: owner.id },
      select: { id: true },
    });
    return branch !== null;
  }
  const professional = await db.professional.findFirst({
    where: { tenantId, id: owner.id },
    select: { id: true },
  });
  return professional !== null;
}

export function createPrismaScheduleRepositories(
  _db: PrismaClient,
  tenantDb: TenantDb,
): ScheduleRepositories {
  return {
    weekly: {
      async listByTenant(tenantId) {
        return tenantDb.run(tenantId, (tx) =>
          tx.weeklySchedule.findMany({
            where: { tenantId },
            select: weeklySelect,
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          }),
        );
      },
      async listByOwner(tenantId, owner) {
        return tenantDb.run(tenantId, async (tx) => {
          const exists = await ownerExists(tx, tenantId, owner);
          if (!exists) {
            return null;
          }
          return tx.weeklySchedule.findMany({
            where: ownerWhere(tenantId, owner),
            select: weeklySelect,
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          });
        });
      },
      async replaceByOwner(tenantId, owner, slots: WeeklySlotInput[]) {
        return tenantDb.run(tenantId, async (tx) => {
          const exists = await ownerExists(tx, tenantId, owner);
          if (!exists) {
            return null;
          }

          await tx.weeklySchedule.deleteMany({
            where: ownerWhere(tenantId, owner),
          });

          if (slots.length > 0) {
            const ownerData = ownerCreateData(tenantId, owner);
            await tx.weeklySchedule.createMany({
              data: slots.map((slot) => ({
                ...ownerData,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                capacity: slot.capacity,
              })),
            });
          }

          return tx.weeklySchedule.findMany({
            where: ownerWhere(tenantId, owner),
            select: weeklySelect,
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          });
        });
      },
    },
    blocks: {
      async listByTenant(tenantId) {
        return tenantDb.run(tenantId, (tx) =>
          tx.calendarBlock.findMany({
            where: { tenantId },
            select: blockSelect,
            orderBy: [
              { startDate: "asc" },
              { startTime: "asc" },
              { endDate: "asc" },
              { endTime: "asc" },
              { id: "asc" },
            ],
          }),
        );
      },
      async createMany(items: CreateCalendarBlockData[]) {
        const first = items[0];
        if (!first) {
          return [];
        }
        return tenantDb.run(first.tenantId, async (tx) => {
          const exists = await ownerExists(tx, first.tenantId, first.owner);
          if (!exists) {
            return null;
          }
          const created: CalendarBlockRecord[] = [];
          for (const data of items) {
            const ownerData = ownerCreateData(data.tenantId, data.owner);
            created.push(
              await tx.calendarBlock.create({
                data: {
                  ...ownerData,
                  startDate: data.startDate,
                  endDate: data.endDate,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  reason: data.reason,
                },
                select: blockSelect,
              }),
            );
          }
          return created;
        });
      },
      async delete(tenantId, id) {
        return tenantDb.run(tenantId, async (tx) => {
          const existing = await tx.calendarBlock.findFirst({
            where: { tenantId, id },
            select: { id: true },
          });
          if (!existing) {
            return false;
          }
          await tx.calendarBlock.delete({ where: { id } });
          return true;
        });
      },
    },
  };
}
