import { assertPermission } from "@/core/authorization";

import { isLocalDate, isLocalTime } from "../../domain/time";
import { BookingError, notFound } from "../errors";
import type {
  AppointmentRecord,
  AvailabilityRepository,
  BookingActor,
} from "../ports/availability-repository";

export function createCreateAppointment(repo: AvailabilityRepository) {
  return async function createAppointment(input: {
    actor: BookingActor;
    professionalId: string;
    serviceId: string;
    clientId: string;
    localDate: string;
    localTime: string;
    now: Date;
  }): Promise<AppointmentRecord> {
    assertPermission(input.actor.role, "booking.write");
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }
    if (!isLocalTime(input.localTime)) {
      throw new BookingError("VALIDATION", "TIME_INVALID", "localTime");
    }

    const result = await repo.reserveSlot({
      tenantId: input.actor.tenantId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      clientId: input.clientId,
      localDate: input.localDate,
      localTime: input.localTime,
      now: input.now,
    });

    if (result.status === "created") {
      return result.appointment;
    }
    if (result.status === "not_found") {
      notFound();
    }
    if (result.status === "service_not_offered") {
      throw new BookingError("VALIDATION", "SERVICE_NOT_OFFERED", "serviceId");
    }
    throw new BookingError("CONFLICT", "SLOT_UNAVAILABLE", "localTime");
  };
}
