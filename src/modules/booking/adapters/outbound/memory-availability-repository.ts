import { randomUUID } from "node:crypto";

import { evaluateReservation } from "@/modules/booking/application/evaluate-reservation";
import type {
  AgendaProfessional,
  AppointmentDetail,
  AvailabilityRepository,
  AvailabilitySnapshot,
  CalendarBlockWindow,
  DayAppointmentRecord,
  MonthAppointmentRecord,
  MonthBlockRecord,
  OccupyingAppointment,
} from "@/modules/booking/application/ports/availability-repository";
import {
  canCancelAppointment,
  canMarkCompleted,
  canMarkNoShow,
  canRescheduleAppointment,
  occupiesAgenda,
} from "@/modules/booking/domain/appointment-lifecycle";

type StoredDayAppointment = DayAppointmentRecord & {
  tenantId: string;
  professionalId: string;
  localDate: string;
  storedStatus: string;
  serviceId: string;
  clientId: string;
};

export function createMemoryAvailabilityRepository(seed: {
  snapshot: AvailabilitySnapshot;
  professionals?: AgendaProfessional[];
  extraBlocksByProfessionalId?: Record<string, CalendarBlockWindow[]>;
  appointments?: OccupyingAppointment[];
  monthBlocks?: MonthBlockRecord[];
  dayAppointments?: (Omit<DayAppointmentRecord, "clientId" | "status"> & {
    tenantId?: string;
    professionalId: string;
    localDate: string;
    status: DayAppointmentRecord["status"] | "CANCELLED" | "NO_SHOW";
    serviceId?: string;
    clientId?: string;
  })[];
}): AvailabilityRepository {
  const fallbackOccupancy = [...(seed.appointments ?? seed.snapshot.appointments)];
  const dayAppointments: StoredDayAppointment[] = (seed.dayAppointments ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenantId ?? "",
    professionalId: row.professionalId,
    localDate: row.localDate,
    localTime: row.localTime,
    durationMinutes: row.durationMinutes,
    status: occupiesAgenda(row.status)
      ? (row.status as DayAppointmentRecord["status"])
      : "CONFIRMED",
    storedStatus: row.status,
    serviceName: row.serviceName,
    serviceId: row.serviceId ?? seed.snapshot.service?.id ?? "",
    clientId: row.clientId ?? "",
    clientFirstName: row.clientFirstName,
    clientLastName: row.clientLastName,
    clientPhone: row.clientPhone,
  }));

  function allProfessionals(): AgendaProfessional[] {
    if (seed.professionals) {
      return seed.professionals.map((professional) => ({
        ...professional,
        serviceIds: [...professional.serviceIds],
      }));
    }
    return seed.snapshot.professional
      ? [
          {
            ...seed.snapshot.professional,
            serviceIds: [...seed.snapshot.professional.serviceIds],
          },
        ]
      : [];
  }

  function belongsToTenant(rowTenantId: string, tenantId: string): boolean {
    return rowTenantId === "" || rowTenantId === tenantId;
  }

  function occupyingFor(
    tenantId: string,
    professionalId: string,
    localDate: string,
    excludeAppointmentId?: string,
  ): OccupyingAppointment[] {
    const matchingDay = dayAppointments.filter(
      (row) =>
        belongsToTenant(row.tenantId, tenantId) &&
        row.professionalId === professionalId &&
        row.localDate === localDate,
    );
    if (matchingDay.length > 0 || dayAppointments.length > 0) {
      return matchingDay
        .filter((row) => occupiesAgenda(row.storedStatus) && row.id !== excludeAppointmentId)
        .map((row) => ({
          localTime: row.localTime,
          durationMinutes: row.durationMinutes,
        }));
    }
    if (professionalId === seed.snapshot.professional?.id) {
      return [...fallbackOccupancy];
    }
    return [];
  }

  function occupyingForBranch(
    tenantId: string,
    localDate: string,
    excludeAppointmentId?: string,
  ): OccupyingAppointment[] {
    if (dayAppointments.length > 0) {
      return dayAppointments
        .filter(
          (row) =>
            belongsToTenant(row.tenantId, tenantId) &&
            row.localDate === localDate &&
            occupiesAgenda(row.storedStatus) &&
            row.id !== excludeAppointmentId,
        )
        .map((row) => ({
          localTime: row.localTime,
          durationMinutes: row.durationMinutes,
        }));
    }
    return [...(seed.snapshot.branchAppointments ?? fallbackOccupancy)];
  }

  function snapshotFor(
    tenantId: string,
    professionalId: string,
    serviceId: string,
    localDate: string,
    excludeAppointmentId?: string,
  ): AvailabilitySnapshot {
    const professional = allProfessionals().find((item) => item.id === professionalId) ?? null;
    const service =
      seed.snapshot.service && seed.snapshot.service.id === serviceId
        ? { ...seed.snapshot.service }
        : null;
    return {
      timezone: seed.snapshot.timezone,
      professional,
      service,
      branchName: seed.snapshot.branchName,
      professionalBands: seed.snapshot.professionalBands.map((band) => ({ ...band })),
      branchBands: seed.snapshot.branchBands.map((band) => ({ ...band })),
      blocks: [
        ...seed.snapshot.blocks.map((block) => ({
          ...block,
          owner: "branch" as const,
        })),
        ...(seed.extraBlocksByProfessionalId?.[professionalId] ?? []).map((block) => ({
          ...block,
          owner: "professional" as const,
        })),
      ],
      appointments: occupyingFor(tenantId, professionalId, localDate, excludeAppointmentId),
      branchAppointments: occupyingForBranch(tenantId, localDate, excludeAppointmentId),
    };
  }

  function toDetail(row: StoredDayAppointment): AppointmentDetail | null {
    if (!row.serviceId) {
      return null;
    }
    const professionalName =
      allProfessionals().find((item) => item.id === row.professionalId)?.displayName ?? "";
    return {
      id: row.id,
      localDate: row.localDate,
      localTime: row.localTime,
      professionalId: row.professionalId,
      serviceId: row.serviceId,
      clientId: row.clientId,
      status: row.storedStatus,
      durationMinutes: row.durationMinutes,
      serviceName: row.serviceName,
      professionalName,
      clientFirstName: row.clientFirstName,
      clientLastName: row.clientLastName,
      clientPhone: row.clientPhone,
    };
  }

  return {
    async listProfessionals() {
      return allProfessionals();
    },
    async listServices() {
      return seed.snapshot.service ? [{ ...seed.snapshot.service }] : [];
    },
    async loadSnapshot(tenantId, professionalId, serviceId, localDate, excludeAppointmentId) {
      return snapshotFor(tenantId, professionalId, serviceId, localDate, excludeAppointmentId);
    },
    async findAppointment(tenantId, appointmentId) {
      const row = dayAppointments.find((item) => item.id === appointmentId);
      if (!row || (row.tenantId !== "" && row.tenantId !== tenantId)) {
        return null;
      }
      return toDetail(row);
    },
    async listDayAppointments(tenantId, professionalId, localDate) {
      return dayAppointments
        .filter(
          (row) =>
            occupiesAgenda(row.storedStatus) &&
            row.professionalId === professionalId &&
            row.localDate === localDate &&
            (row.tenantId === "" || row.tenantId === tenantId),
        )
        .map((row) => ({
          id: row.id,
          localTime: row.localTime,
          durationMinutes: row.durationMinutes,
          status: row.status,
          serviceName: row.serviceName,
          clientId: row.clientId,
          clientFirstName: row.clientFirstName,
          clientLastName: row.clientLastName,
          clientPhone: row.clientPhone,
        }))
        .sort(
          (left, right) =>
            left.localTime.localeCompare(right.localTime) || left.id.localeCompare(right.id),
        );
    },
    async listMonthAppointments(tenantId, fromDate, toDate) {
      return dayAppointments
        .filter(
          (row) =>
            row.localDate >= fromDate &&
            row.localDate <= toDate &&
            (row.tenantId === "" || row.tenantId === tenantId),
        )
        .map((row): MonthAppointmentRecord => ({
          id: row.id,
          localDate: row.localDate,
          localTime: row.localTime,
          durationMinutes: row.durationMinutes,
          status: row.storedStatus as MonthAppointmentRecord["status"],
          professionalId: row.professionalId,
          professionalName:
            allProfessionals().find((item) => item.id === row.professionalId)?.displayName ?? "",
          serviceName: row.serviceName,
          clientId: row.clientId,
          clientFirstName: row.clientFirstName,
          clientLastName: row.clientLastName,
          clientPhone: row.clientPhone,
        }))
        .sort(
          (left, right) =>
            left.localDate.localeCompare(right.localDate) ||
            left.localTime.localeCompare(right.localTime) ||
            left.id.localeCompare(right.id),
        );
    },
    async listMonthBlocks(tenantId, fromDate, toDate) {
      return (seed.monthBlocks ?? [])
        .filter(
          (block) =>
            block.startDate <= toDate &&
            block.endDate >= fromDate &&
            // memory seed has no tenant field; treat as belonging to the caller
            Boolean(tenantId),
        )
        .map((block) => ({ ...block }))
        .sort(
          (left, right) =>
            left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id),
        );
    },
    async reserveSlot(input) {
      const evaluation = evaluateReservation(
        snapshotFor(input.tenantId, input.professionalId, input.serviceId, input.localDate),
        input.localDate,
        input.localTime,
        input.now,
      );
      if (evaluation.status !== "ok") {
        return evaluation;
      }
      const id = randomUUID();
      fallbackOccupancy.push({
        localTime: input.localTime,
        durationMinutes: evaluation.occupancyMinutes,
      });
      dayAppointments.push({
        id,
        tenantId: input.tenantId,
        professionalId: input.professionalId,
        localDate: input.localDate,
        localTime: input.localTime,
        durationMinutes: evaluation.occupancyMinutes,
        status: "CONFIRMED",
        storedStatus: "CONFIRMED",
        serviceName: evaluation.service.name,
        serviceId: input.serviceId,
        clientId: input.clientId,
        clientFirstName: null,
        clientLastName: null,
        clientPhone: "",
      });
      return {
        status: "created",
        appointment: {
          id,
          localDate: input.localDate,
          localTime: input.localTime,
          professionalId: input.professionalId,
          serviceId: input.serviceId,
          clientId: input.clientId,
        },
      };
    },
    async rescheduleSlot(input) {
      const row = dayAppointments.find((item) => item.id === input.appointmentId);
      if (!row || (row.tenantId !== "" && row.tenantId !== input.tenantId)) {
        return { status: "not_found" };
      }
      if (!canRescheduleAppointment(row.storedStatus)) {
        return { status: "not_movable" };
      }
      if (!row.serviceId) {
        return { status: "not_found" };
      }
      if (
        row.professionalId === input.professionalId &&
        row.localDate === input.localDate &&
        row.localTime === input.localTime
      ) {
        return { status: "no_change" };
      }

      const evaluation = evaluateReservation(
        snapshotFor(input.tenantId, input.professionalId, row.serviceId, input.localDate, row.id),
        input.localDate,
        input.localTime,
        input.now,
      );
      if (evaluation.status !== "ok") {
        return evaluation;
      }

      row.professionalId = input.professionalId;
      row.localDate = input.localDate;
      row.localTime = input.localTime;
      row.durationMinutes = evaluation.occupancyMinutes;

      return {
        status: "rescheduled",
        appointment: {
          id: row.id,
          localDate: row.localDate,
          localTime: row.localTime,
          professionalId: row.professionalId,
          serviceId: row.serviceId,
          clientId: row.clientId,
        },
      };
    },
    async cancelAppointment(tenantId, appointmentId, _cancelledBy) {
      const row = dayAppointments.find((item) => item.id === appointmentId);
      if (!row || (row.tenantId !== "" && row.tenantId !== tenantId)) {
        return { status: "not_found" };
      }
      if (row.storedStatus === "CANCELLED") {
        return { status: "already_cancelled" };
      }
      if (!canCancelAppointment(row.storedStatus)) {
        return { status: "not_cancellable" };
      }
      row.storedStatus = "CANCELLED";
      releaseOccupancy(row.localTime, row.durationMinutes);
      return { status: "cancelled" };
    },
    async markNoShow(tenantId, appointmentId) {
      const row = dayAppointments.find((item) => item.id === appointmentId);
      if (!row || (row.tenantId !== "" && row.tenantId !== tenantId)) {
        return { status: "not_found" };
      }
      if (row.storedStatus === "NO_SHOW") {
        return { status: "already_no_show" };
      }
      if (!canMarkNoShow(row.storedStatus)) {
        return { status: "not_no_showable" };
      }
      row.storedStatus = "NO_SHOW";
      releaseOccupancy(row.localTime, row.durationMinutes);
      return { status: "marked" };
    },
    async markCompleted(tenantId, appointmentId) {
      const row = dayAppointments.find((item) => item.id === appointmentId);
      if (!row || (row.tenantId !== "" && row.tenantId !== tenantId)) {
        return { status: "not_found" };
      }
      if (row.storedStatus === "COMPLETED") {
        return { status: "already_completed" };
      }
      if (!canMarkCompleted(row.storedStatus)) {
        return { status: "not_completable" };
      }
      row.storedStatus = "COMPLETED";
      row.status = "COMPLETED";
      return { status: "marked" };
    },
  };

  function releaseOccupancy(localTime: string, durationMinutes: number) {
    const occupyingIndex = fallbackOccupancy.findIndex(
      (item) => item.localTime === localTime && item.durationMinutes === durationMinutes,
    );
    if (occupyingIndex >= 0) {
      fallbackOccupancy.splice(occupyingIndex, 1);
    }
  }
}
