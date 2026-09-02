import { assertPermission } from "@/core/authorization";

import { CANCELLED_BY_BUSINESS } from "../../domain/appointment-lifecycle";
import { BookingError, notFound } from "../errors";
import type { AvailabilityRepository, BookingActor } from "../ports/availability-repository";

export function createCancelAppointment(repo: AvailabilityRepository) {
  return async function cancelAppointment(input: {
    actor: BookingActor;
    appointmentId: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "booking.write");
    if (!input.appointmentId.trim()) {
      notFound();
    }

    const result = await repo.cancelAppointment(
      input.actor.tenantId,
      input.appointmentId,
      CANCELLED_BY_BUSINESS,
    );
    if (result.status === "cancelled") {
      return;
    }
    if (result.status === "not_found") {
      notFound();
    }
    if (result.status === "already_cancelled") {
      throw new BookingError("CONFLICT", "ALREADY_CANCELLED", "appointmentId");
    }
    throw new BookingError("CONFLICT", "NOT_CANCELLABLE", "appointmentId");
  };
}
