import { randomUUID } from "node:crypto";

import type {
  CalendarBlockRecord,
  CreateCalendarBlockData,
  ScheduleOwner,
  ScheduleRepositories,
  WeeklySlotInput,
  WeeklySlotRecord,
} from "@/modules/tenant-config/application/ports/schedule-repository";

function cloneSlot(row: WeeklySlotRecord): WeeklySlotRecord {
  return { ...row };
}

function cloneBlock(row: CalendarBlockRecord): CalendarBlockRecord {
  return { ...row };
}

function matchesOwner(
  row: { branchId: string | null; professionalId: string | null },
  owner: ScheduleOwner,
) {
  if (owner.kind === "branch") {
    return row.branchId === owner.id && row.professionalId === null;
  }
  return row.professionalId === owner.id && row.branchId === null;
}

function sortSlots(rows: WeeklySlotRecord[]): WeeklySlotRecord[] {
  return [...rows].sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return left.dayOfWeek - right.dayOfWeek;
    }
    return left.startTime.localeCompare(right.startTime);
  });
}

export function createMemorySchedule(seed?: {
  branches?: { id: string; tenantId: string }[];
  professionals?: { id: string; tenantId: string }[];
  slots?: WeeklySlotRecord[];
  blocks?: CalendarBlockRecord[];
}): ScheduleRepositories {
  const branches = new Map((seed?.branches ?? []).map((branch) => [branch.id, { ...branch }]));
  const professionals = new Map(
    (seed?.professionals ?? []).map((professional) => [professional.id, { ...professional }]),
  );
  const slots = new Map((seed?.slots ?? []).map((row) => [row.id, cloneSlot(row)]));
  const blocks = new Map((seed?.blocks ?? []).map((row) => [row.id, cloneBlock(row)]));

  function ownerInTenant(tenantId: string, owner: ScheduleOwner): boolean {
    if (owner.kind === "branch") {
      const branch = branches.get(owner.id);
      return Boolean(branch && branch.tenantId === tenantId);
    }
    const professional = professionals.get(owner.id);
    return Boolean(professional && professional.tenantId === tenantId);
  }

  return {
    weekly: {
      async listByTenant(tenantId) {
        return sortSlots(
          [...slots.values()].filter((row) => row.tenantId === tenantId).map(cloneSlot),
        );
      },
      async listByOwner(tenantId, owner) {
        if (!ownerInTenant(tenantId, owner)) {
          return null;
        }
        return sortSlots(
          [...slots.values()]
            .filter((row) => row.tenantId === tenantId && matchesOwner(row, owner))
            .map(cloneSlot),
        );
      },
      async replaceByOwner(tenantId, owner, nextSlots: WeeklySlotInput[]) {
        if (!ownerInTenant(tenantId, owner)) {
          return null;
        }

        for (const [id, row] of slots) {
          if (row.tenantId === tenantId && matchesOwner(row, owner)) {
            slots.delete(id);
          }
        }

        const created: WeeklySlotRecord[] = nextSlots.map((slot) => {
          const row: WeeklySlotRecord = {
            id: randomUUID(),
            tenantId,
            branchId: owner.kind === "branch" ? owner.id : null,
            professionalId: owner.kind === "professional" ? owner.id : null,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: slot.capacity,
          };
          slots.set(row.id, row);
          return cloneSlot(row);
        });

        return sortSlots(created);
      },
    },
    blocks: {
      async listByTenant(tenantId) {
        return [...blocks.values()]
          .filter((row) => row.tenantId === tenantId)
          .map(cloneBlock)
          .sort((left, right) => {
            if (left.startDate !== right.startDate) {
              return left.startDate.localeCompare(right.startDate);
            }
            return (left.startTime ?? "").localeCompare(right.startTime ?? "");
          });
      },
      async create(data: CreateCalendarBlockData) {
        if (!ownerInTenant(data.tenantId, data.owner)) {
          return null;
        }
        const row: CalendarBlockRecord = {
          id: randomUUID(),
          tenantId: data.tenantId,
          branchId: data.owner.kind === "branch" ? data.owner.id : null,
          professionalId: data.owner.kind === "professional" ? data.owner.id : null,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          reason: data.reason,
        };
        blocks.set(row.id, row);
        return cloneBlock(row);
      },
      async delete(tenantId, id) {
        const row = blocks.get(id);
        if (!row || row.tenantId !== tenantId) {
          return false;
        }
        blocks.delete(id);
        return true;
      },
    },
  };
}
