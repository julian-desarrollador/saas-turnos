import { assertPermission } from "@/core/authorization";

import { MINUTES_IN_DAY, isLocalDate, minutesToTime, timeToMinutes } from "../../domain/time";
import { BookingError } from "../errors";
import type {
  AvailabilityRepository,
  BookingActor,
  DayAppointmentRecord,
} from "../ports/availability-repository";

export type DayAppointment = DayAppointmentRecord & {
  endTime: string;
};

export function occupancyEndTime(localTime: string, durationMinutes: number): string {
  const end = timeToMinutes(localTime) + durationMinutes;
  return minutesToTime(Math.min(end, MINUTES_IN_DAY));
}

export function createListDayAppointments(repo: AvailabilityRepository) {
  return async function listDayAppointments(input: {
    actor: BookingActor;
    professionalId: string;
    localDate: string;
  }): Promise<DayAppointment[]> {
    assertPermission(input.actor.role, "booking.read");
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }

    const rows = await repo.listDayAppointments(
      input.actor.tenantId,
      input.professionalId,
      input.localDate,
    );
    return rows.map((row) => ({
      ...row,
      endTime: occupancyEndTime(row.localTime, row.durationMinutes),
    }));
  };
}
