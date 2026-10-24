import { isLocalDate, isLocalTime } from "../../domain/time";
import { BookingError, notFound } from "../errors";
import type { AppointmentRecord, AvailabilityRepository } from "../ports/availability-repository";

export function createRescheduleDeviceAppointment(repo: AvailabilityRepository) {
  return async function rescheduleDeviceAppointment(input: {
    tenantId: string;
    deviceKey: string;
    appointmentId: string;
    professionalId: string | null;
    localDate: string;
    localTime: string;
    now: Date;
  }): Promise<AppointmentRecord> {
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }
    if (!isLocalTime(input.localTime)) {
      throw new BookingError("VALIDATION", "TIME_INVALID", "localTime");
    }
    const owned = (await repo.listDeviceAppointments(input.tenantId, input.deviceKey)).find(
      (appointment) => appointment.id === input.appointmentId,
    );
    if (!owned) {
      notFound();
    }
    if (owned.startsAt.getTime() <= input.now.getTime()) {
      throw new BookingError("CONFLICT", "NOT_MOVABLE", "appointmentId");
    }
    const professionalIds = input.professionalId
      ? [input.professionalId]
      : (await repo.listProfessionals(input.tenantId))
          .filter(
            (professional) =>
              professional.isActive && professional.serviceIds.includes(owned.serviceId),
          )
          .map((professional) => professional.id)
          .sort((left, right) => left.localeCompare(right));

    let sawNoChange = false;
    for (const professionalId of professionalIds) {
      const result = await repo.rescheduleSlot({
        tenantId: input.tenantId,
        appointmentId: input.appointmentId,
        professionalId,
        localDate: input.localDate,
        localTime: input.localTime,
        now: input.now,
      });
      if (result.status === "rescheduled") {
        return result.appointment;
      }
      if (result.status === "no_change") {
        sawNoChange = true;
      }
    }
    if (sawNoChange) {
      throw new BookingError("CONFLICT", "NO_CHANGE", "localTime");
    }
    throw new BookingError("CONFLICT", "SLOT_UNAVAILABLE", "localTime");
  };
}
