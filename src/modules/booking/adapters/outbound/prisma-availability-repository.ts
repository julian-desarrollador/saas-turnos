import type { PrismaClient } from "@/generated/prisma/client";

import { evaluateReservation } from "@/modules/booking/application/evaluate-reservation";
import type {
  AgendaProfessional,
  AgendaService,
  AppointmentDetail,
  AvailabilityRepository,
  AvailabilitySnapshot,
  CancelAppointmentResult,
  DayAppointmentRecord,
  OccupyingAppointmentStatus,
  ReserveSlotResult,
  RescheduleSlotResult,
} from "@/modules/booking/application/ports/availability-repository";
import {
  canCancelAppointment,
  canMarkCompleted,
  canMarkNoShow,
  canRescheduleAppointment,
} from "@/modules/booking/domain/appointment-lifecycle";

const professionalSelect = {
  id: true,
  displayName: true,
  branchId: true,
  isActive: true,
  services: { select: { serviceId: true } },
  branch: { select: { name: true } },
} as const;

const serviceSelect = {
  id: true,
  name: true,
  durationMinutes: true,
  prepMinutes: true,
  cleanupMinutes: true,
  earliestStart: true,
  latestStart: true,
  isActive: true,
  priceAmount: true,
} as const;

type SnapshotDb = Pick<
  PrismaClient,
  "tenant" | "professional" | "service" | "weeklySchedule" | "calendarBlock" | "appointment"
>;

function toProfessional(row: {
  id: string;
  displayName: string;
  branchId: string;
  isActive: boolean;
  services: { serviceId: string }[];
}): AgendaProfessional {
  return {
    id: row.id,
    displayName: row.displayName,
    branchId: row.branchId,
    isActive: row.isActive,
    serviceIds: row.services.map((link) => link.serviceId),
  };
}

function toService(row: {
  id: string;
  name: string;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  isActive: boolean;
  priceAmount: number;
}): AgendaService {
  return row;
}

function uniqueSortedDayKeys(keys: string[]): string[] {
  return [...new Set(keys)].sort((left, right) => left.localeCompare(right));
}

async function lockProfessionalDays(
  tx: Pick<PrismaClient, "$executeRaw">,
  tenantId: string,
  keys: string[],
): Promise<void> {
  for (const dayKey of uniqueSortedDayKeys(keys)) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tenantId}), hashtext(${dayKey}))`;
  }
}

async function readAvailabilitySnapshot(
  db: SnapshotDb,
  tenantId: string,
  professionalId: string,
  serviceId: string,
  localDate: string,
  excludeAppointmentId?: string,
): Promise<AvailabilitySnapshot | null> {
  const tenant = await db.tenant.findFirst({
    where: { id: tenantId },
    select: { timezone: true },
  });
  if (!tenant) {
    return null;
  }

  const [professionalRow, serviceRow] = await Promise.all([
    db.professional.findFirst({
      where: { tenantId, id: professionalId },
      select: professionalSelect,
    }),
    db.service.findFirst({
      where: { tenantId, id: serviceId },
      select: serviceSelect,
    }),
  ]);

  const snapshot: AvailabilitySnapshot = {
    timezone: tenant.timezone,
    professional: professionalRow ? toProfessional(professionalRow) : null,
    service: serviceRow ? toService(serviceRow) : null,
    branchName: professionalRow?.branch.name ?? null,
    professionalBands: [],
    branchBands: [],
    blocks: [],
    appointments: [],
    branchAppointments: [],
  };

  if (!professionalRow) {
    return snapshot;
  }

  const branchId = professionalRow.branchId;
  const [schedules, blocks, appointments] = await Promise.all([
    db.weeklySchedule.findMany({
      where: {
        tenantId,
        OR: [
          { professionalId, branchId: null },
          { branchId, professionalId: null },
        ],
      },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        capacity: true,
        professionalId: true,
        branchId: true,
      },
    }),
    db.calendarBlock.findMany({
      where: {
        tenantId,
        startDate: { lte: localDate },
        endDate: { gte: localDate },
        OR: [
          { professionalId, branchId: null },
          { branchId, professionalId: null },
        ],
      },
      select: {
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        professionalId: true,
        branchId: true,
      },
    }),
    db.appointment.findMany({
      where: {
        tenantId,
        branchId,
        localDate,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { localTime: true, durationMinutes: true, professionalId: true },
    }),
  ]);

  snapshot.professionalBands = schedules
    .filter((row) => row.professionalId === professionalId)
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      capacity: row.capacity,
    }));
  snapshot.branchBands = schedules
    .filter((row) => row.branchId === branchId && row.professionalId === null)
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      capacity: row.capacity,
    }));
  snapshot.blocks = blocks.map((row) => ({
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime,
    endTime: row.endTime,
    owner: row.professionalId ? "professional" : "branch",
  }));
  snapshot.appointments = appointments
    .filter((row) => row.professionalId === professionalId)
    .map((row) => ({
      localTime: row.localTime,
      durationMinutes: row.durationMinutes,
    }));
  snapshot.branchAppointments = appointments.map((row) => ({
    localTime: row.localTime,
    durationMinutes: row.durationMinutes,
  }));
  return snapshot;
}

function toAppointmentDetail(row: {
  id: string;
  localDate: string;
  localTime: string;
  professionalId: string;
  clientId: string;
  status: string;
  durationMinutes: number;
  professional: { displayName: string };
  client: { firstName: string | null; lastName: string | null; phone: string };
  services: { serviceId: string; serviceName: string }[];
}): AppointmentDetail | null {
  const service = row.services[0];
  if (!service) {
    return null;
  }
  return {
    id: row.id,
    localDate: row.localDate,
    localTime: row.localTime,
    professionalId: row.professionalId,
    serviceId: service.serviceId,
    clientId: row.clientId,
    status: row.status,
    durationMinutes: row.durationMinutes,
    serviceName: service.serviceName,
    professionalName: row.professional.displayName,
    clientFirstName: row.client.firstName,
    clientLastName: row.client.lastName,
    clientPhone: row.client.phone,
  };
}

const appointmentDetailSelect = {
  id: true,
  localDate: true,
  localTime: true,
  professionalId: true,
  clientId: true,
  status: true,
  durationMinutes: true,
  professional: { select: { displayName: true } },
  client: { select: { firstName: true, lastName: true, phone: true } },
  services: { select: { serviceId: true, serviceName: true } },
} as const;

function toOccupyingStatus(status: string): OccupyingAppointmentStatus {
  if (
    status === "PENDING" ||
    status === "CONFIRMED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED"
  ) {
    return status;
  }
  return "CONFIRMED";
}

export function createPrismaAvailabilityRepository(db: PrismaClient): AvailabilityRepository {
  return {
    async listProfessionals(tenantId) {
      const rows = await db.professional.findMany({
        where: { tenantId },
        select: professionalSelect,
        orderBy: { displayName: "asc" },
      });
      return rows.map(toProfessional);
    },
    async listServices(tenantId) {
      const rows = await db.service.findMany({
        where: { tenantId },
        select: serviceSelect,
        orderBy: { name: "asc" },
      });
      return rows.map(toService);
    },
    async loadSnapshot(tenantId, professionalId, serviceId, localDate, excludeAppointmentId) {
      return readAvailabilitySnapshot(
        db,
        tenantId,
        professionalId,
        serviceId,
        localDate,
        excludeAppointmentId,
      );
    },
    async findAppointment(tenantId, appointmentId) {
      const row = await db.appointment.findFirst({
        where: { tenantId, id: appointmentId },
        select: appointmentDetailSelect,
      });
      if (!row) {
        return null;
      }
      return toAppointmentDetail(row);
    },
    async listDayAppointments(tenantId, professionalId, localDate) {
      const rows = await db.appointment.findMany({
        where: {
          tenantId,
          professionalId,
          localDate,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: {
          id: true,
          localTime: true,
          durationMinutes: true,
          status: true,
          clientId: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
          services: { select: { serviceName: true } },
        },
        orderBy: [{ localTime: "asc" }, { id: "asc" }],
      });
      return rows.map((row): DayAppointmentRecord => ({
        id: row.id,
        localTime: row.localTime,
        durationMinutes: row.durationMinutes,
        status: toOccupyingStatus(row.status),
        serviceName: row.services[0]?.serviceName ?? "Servicio",
        clientId: row.clientId,
        clientFirstName: row.client.firstName,
        clientLastName: row.client.lastName,
        clientPhone: row.client.phone,
      }));
    },
    async listMonthAppointments(tenantId, fromDate, toDate) {
      const rows = await db.appointment.findMany({
        where: {
          tenantId,
          localDate: { gte: fromDate, lte: toDate },
        },
        select: {
          id: true,
          localDate: true,
          localTime: true,
          durationMinutes: true,
          status: true,
          professionalId: true,
          clientId: true,
          professional: { select: { displayName: true } },
          client: { select: { firstName: true, lastName: true, phone: true } },
          services: { select: { serviceName: true } },
        },
        orderBy: [{ localDate: "asc" }, { localTime: "asc" }, { id: "asc" }],
      });
      return rows.map((row) => ({
        id: row.id,
        localDate: row.localDate,
        localTime: row.localTime,
        durationMinutes: row.durationMinutes,
        status: row.status as
          "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
        professionalId: row.professionalId,
        professionalName: row.professional.displayName,
        serviceName: row.services[0]?.serviceName ?? "Servicio",
        clientId: row.clientId,
        clientFirstName: row.client.firstName,
        clientLastName: row.client.lastName,
        clientPhone: row.client.phone,
      }));
    },
    async listMonthBlocks(tenantId, fromDate, toDate) {
      const rows = await db.calendarBlock.findMany({
        where: {
          tenantId,
          startDate: { lte: toDate },
          endDate: { gte: fromDate },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          reason: true,
          professionalId: true,
          branchId: true,
          professional: { select: { displayName: true } },
          branch: { select: { name: true } },
        },
        orderBy: [{ startDate: "asc" }, { id: "asc" }],
      });
      return rows.map((row) => ({
        id: row.id,
        startDate: row.startDate,
        endDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
        professionalId: row.professionalId,
        professionalName: row.professional?.displayName ?? null,
        branchId: row.branchId,
        branchName: row.branch?.name ?? null,
      }));
    },
    async reserveSlot(input) {
      return db.$transaction(async (tx) => {
        const professional = await tx.professional.findFirst({
          where: { tenantId: input.tenantId, id: input.professionalId },
          select: { branchId: true },
        });
        await lockProfessionalDays(tx, input.tenantId, [
          `${input.professionalId}:${input.localDate}`,
          ...(professional ? [`branch:${professional.branchId}:${input.localDate}`] : []),
        ]);

        const snapshot = await readAvailabilitySnapshot(
          tx,
          input.tenantId,
          input.professionalId,
          input.serviceId,
          input.localDate,
        );
        const evaluation = evaluateReservation(
          snapshot,
          input.localDate,
          input.localTime,
          input.now,
        );
        if (evaluation.status !== "ok") {
          return evaluation;
        }

        const created = await tx.appointment.create({
          data: {
            tenantId: input.tenantId,
            branchId: evaluation.branchId,
            professionalId: input.professionalId,
            clientId: input.clientId,
            status: "CONFIRMED",
            origin: "PANEL",
            localDate: input.localDate,
            localTime: input.localTime,
            timezone: evaluation.timezone,
            startsAt: evaluation.startsAt,
            endsAt: evaluation.endsAt,
            durationMinutes: evaluation.occupancyMinutes,
            services: {
              create: {
                serviceId: evaluation.service.id,
                serviceName: evaluation.service.name,
                durationMinutes: evaluation.service.durationMinutes,
                priceAmount: evaluation.service.priceAmount,
              },
            },
          },
          select: {
            id: true,
            localDate: true,
            localTime: true,
            professionalId: true,
            clientId: true,
          },
        });

        const result: ReserveSlotResult = {
          status: "created",
          appointment: {
            id: created.id,
            localDate: created.localDate,
            localTime: created.localTime,
            professionalId: created.professionalId,
            serviceId: evaluation.service.id,
            clientId: created.clientId,
          },
        };
        return result;
      });
    },
    async rescheduleSlot(input) {
      const existing = await db.appointment.findFirst({
        where: { tenantId: input.tenantId, id: input.appointmentId },
        select: {
          id: true,
          status: true,
          professionalId: true,
          branchId: true,
          localDate: true,
          localTime: true,
          clientId: true,
          services: { select: { serviceId: true } },
        },
      });
      if (!existing) {
        return { status: "not_found" };
      }
      if (!canRescheduleAppointment(existing.status)) {
        return { status: "not_movable" };
      }
      const serviceId = existing.services[0]?.serviceId;
      if (!serviceId) {
        return { status: "not_found" };
      }
      if (
        existing.professionalId === input.professionalId &&
        existing.localDate === input.localDate &&
        existing.localTime === input.localTime
      ) {
        return { status: "no_change" };
      }

      return db.$transaction(async (tx) => {
        const destination = await tx.professional.findFirst({
          where: { tenantId: input.tenantId, id: input.professionalId },
          select: { branchId: true },
        });
        await lockProfessionalDays(tx, input.tenantId, [
          `${existing.professionalId}:${existing.localDate}`,
          `${input.professionalId}:${input.localDate}`,
          `branch:${existing.branchId}:${existing.localDate}`,
          ...(destination ? [`branch:${destination.branchId}:${input.localDate}`] : []),
        ]);

        const locked = await tx.appointment.findFirst({
          where: { tenantId: input.tenantId, id: existing.id },
          select: {
            id: true,
            status: true,
            professionalId: true,
            localDate: true,
            localTime: true,
          },
        });
        if (!locked) {
          return { status: "not_found" };
        }
        if (!canRescheduleAppointment(locked.status)) {
          return { status: "not_movable" };
        }
        if (
          locked.professionalId === input.professionalId &&
          locked.localDate === input.localDate &&
          locked.localTime === input.localTime
        ) {
          return { status: "no_change" };
        }

        const snapshot = await readAvailabilitySnapshot(
          tx,
          input.tenantId,
          input.professionalId,
          serviceId,
          input.localDate,
          existing.id,
        );
        const evaluation = evaluateReservation(
          snapshot,
          input.localDate,
          input.localTime,
          input.now,
        );
        if (evaluation.status !== "ok") {
          return evaluation;
        }

        const written = await tx.appointment.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            professionalId: input.professionalId,
            branchId: evaluation.branchId,
            localDate: input.localDate,
            localTime: input.localTime,
            timezone: evaluation.timezone,
            startsAt: evaluation.startsAt,
            endsAt: evaluation.endsAt,
            durationMinutes: evaluation.occupancyMinutes,
          },
        });
        if (written.count !== 1) {
          return { status: "not_found" };
        }

        const result: RescheduleSlotResult = {
          status: "rescheduled",
          appointment: {
            id: existing.id,
            localDate: input.localDate,
            localTime: input.localTime,
            professionalId: input.professionalId,
            serviceId,
            clientId: existing.clientId,
          },
        };
        return result;
      });
    },
    async cancelAppointment(tenantId, appointmentId, cancelledBy) {
      const existing = await db.appointment.findFirst({
        where: { tenantId, id: appointmentId },
        select: { id: true, status: true },
      });
      if (!existing) {
        return { status: "not_found" };
      }
      if (existing.status === "CANCELLED") {
        return { status: "already_cancelled" };
      }
      if (!canCancelAppointment(existing.status)) {
        return { status: "not_cancellable" };
      }

      await db.appointment.updateMany({
        where: { id: existing.id, tenantId },
        data: { status: "CANCELLED", cancelledBy },
      });
      const result: CancelAppointmentResult = { status: "cancelled" };
      return result;
    },
    async markNoShow(tenantId, appointmentId) {
      const existing = await db.appointment.findFirst({
        where: { tenantId, id: appointmentId },
        select: { id: true, status: true },
      });
      if (!existing) {
        return { status: "not_found" };
      }
      if (existing.status === "NO_SHOW") {
        return { status: "already_no_show" };
      }
      if (!canMarkNoShow(existing.status)) {
        return { status: "not_no_showable" };
      }

      await db.appointment.updateMany({
        where: { id: existing.id, tenantId },
        data: { status: "NO_SHOW" },
      });
      return { status: "marked" };
    },
    async markCompleted(tenantId, appointmentId) {
      const existing = await db.appointment.findFirst({
        where: { tenantId, id: appointmentId },
        select: { id: true, status: true },
      });
      if (!existing) {
        return { status: "not_found" };
      }
      if (existing.status === "COMPLETED") {
        return { status: "already_completed" };
      }
      if (!canMarkCompleted(existing.status)) {
        return { status: "not_completable" };
      }

      await db.appointment.updateMany({
        where: { id: existing.id, tenantId },
        data: { status: "COMPLETED" },
      });
      return { status: "marked" };
    },
  };
}
