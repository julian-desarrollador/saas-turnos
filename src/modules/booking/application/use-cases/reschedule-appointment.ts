import { assertPermission } from "@/core/authorization";

import { isLocalDate, isLocalTime } from "../../domain/time";
import { BookingError, notFound } from "../errors";
import type {
  AppointmentRecord,
  AvailabilityRepository,
  BookingActor,
} from "../ports/availability-repository";

export function createRescheduleAppointment(repo: AvailabilityRepository) {
  return async function rescheduleAppointment(input: {
    actor: BookingActor;
    appointmentId: string;
    professionalId: string;
    localDate: string;
    localTime: string;
    now: Date;
  }): Promise<AppointmentRecord> {
    assertPermission(input.actor.role, "booking.write");
    if (!input.appointmentId.trim()) {
      notFound();
    }
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }
    if (!isLocalTime(input.localTime)) {
      throw new BookingError("VALIDATION", "TIME_INVALID", "localTime");
    }

    const result = await repo.rescheduleSlot({
      tenantId: input.actor.tenantId,
      appointmentId: input.appointmentId,
      professionalId: input.professionalId,
      localDate: input.localDate,
      localTime: input.localTime,
      now: input.now,
    });

    if (result.status === "rescheduled") {
      return result.appointment;
    }
    if (result.status === "not_found") {
      notFound();
    }
    if (result.status === "no_change") {
      throw new BookingError("CONFLICT", "NO_CHANGE", "localTime");
    }
    if (result.status === "not_movable") {
      throw new BookingError("CONFLICT", "NOT_MOVABLE", "appointmentId");
    }
    if (result.status === "service_not_offered") {
      throw new BookingError("VALIDATION", "SERVICE_NOT_OFFERED", "professionalId");
    }
    throw new BookingError("CONFLICT", "SLOT_UNAVAILABLE", "localTime");
  };
}
