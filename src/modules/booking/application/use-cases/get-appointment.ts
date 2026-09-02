import { assertPermission } from "@/core/authorization";

import { notFound } from "../errors";
import type {
  AppointmentDetail,
  AvailabilityRepository,
  BookingActor,
} from "../ports/availability-repository";

export function createGetAppointment(repo: AvailabilityRepository) {
  return async function getAppointment(input: {
    actor: BookingActor;
    appointmentId: string;
  }): Promise<AppointmentDetail> {
    assertPermission(input.actor.role, "booking.read");
    if (!input.appointmentId.trim()) {
      notFound();
    }

    const appointment = await repo.findAppointment(input.actor.tenantId, input.appointmentId);
    if (!appointment) {
      notFound();
    }
    return appointment;
  };
}
