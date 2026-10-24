import { CANCELLED_BY_CLIENT } from "../../domain/appointment-lifecycle";
import { BookingError, notFound } from "../errors";
import type { AvailabilityRepository } from "../ports/availability-repository";

export function createCancelDeviceAppointment(repo: AvailabilityRepository) {
  return async function cancelDeviceAppointment(input: {
    tenantId: string;
    deviceKey: string;
    appointmentId: string;
    now: Date;
  }): Promise<void> {
    const owned = (await repo.listDeviceAppointments(input.tenantId, input.deviceKey)).find(
      (appointment) => appointment.id === input.appointmentId,
    );
    if (!owned) {
      notFound();
    }
    if (owned.startsAt.getTime() <= input.now.getTime()) {
      throw new BookingError("CONFLICT", "NOT_CANCELLABLE", "appointmentId");
    }
    const result = await repo.cancelAppointment(
      input.tenantId,
      input.appointmentId,
      CANCELLED_BY_CLIENT,
    );
    if (result.status === "cancelled") {
      return;
    }
    if (result.status === "not_found") {
      notFound();
    }
    throw new BookingError("CONFLICT", "NOT_CANCELLABLE", "appointmentId");
  };
}
