import { assertPermission } from "@/core/authorization";

import { BookingError, notFound } from "../errors";
import type { AvailabilityRepository, BookingActor } from "../ports/availability-repository";

export function createMarkNoShow(repo: AvailabilityRepository) {
  return async function markNoShow(input: {
    actor: BookingActor;
    appointmentId: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "booking.write");
    if (!input.appointmentId.trim()) {
      notFound();
    }

    const result = await repo.markNoShow(input.actor.tenantId, input.appointmentId);
    if (result.status === "marked") {
      return;
    }
    if (result.status === "not_found") {
      notFound();
    }
    if (result.status === "already_no_show") {
      throw new BookingError("CONFLICT", "ALREADY_NO_SHOW", "appointmentId");
    }
    throw new BookingError("CONFLICT", "NOT_NO_SHOWABLE", "appointmentId");
  };
}
