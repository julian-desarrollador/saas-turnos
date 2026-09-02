import { assertPermission } from "@/core/authorization";

import { BookingError, notFound } from "../errors";
import type { AvailabilityRepository, BookingActor } from "../ports/availability-repository";

export function createMarkCompleted(repo: AvailabilityRepository) {
  return async function markCompleted(input: {
    actor: BookingActor;
    appointmentId: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "booking.write");
    if (!input.appointmentId.trim()) {
      notFound();
    }

    const result = await repo.markCompleted(input.actor.tenantId, input.appointmentId);
    if (result.status === "marked") {
      return;
    }
    if (result.status === "not_found") {
      notFound();
    }
    if (result.status === "already_completed") {
      throw new BookingError("CONFLICT", "ALREADY_COMPLETED", "appointmentId");
    }
    throw new BookingError("CONFLICT", "NOT_COMPLETABLE", "appointmentId");
  };
}
