import { assertPermission } from "@/core/authorization";

import { isLocalDate } from "../../domain/time";
import { BookingError, notFound } from "../errors";
import { offeredFromSnapshot } from "../offered-from-snapshot";
import type { AvailabilityRepository, BookingActor } from "../ports/availability-repository";

export function createListAgendaCatalog(repo: AvailabilityRepository) {
  return async function listAgendaCatalog(actor: BookingActor) {
    assertPermission(actor.role, "booking.read");
    const [professionals, services] = await Promise.all([
      repo.listProfessionals(actor.tenantId),
      repo.listServices(actor.tenantId),
    ]);
    return {
      professionals: professionals.filter((professional) => professional.isActive),
      services: services.filter((service) => service.isActive),
      inactiveProfessionalCount: professionals.filter((professional) => !professional.isActive)
        .length,
      inactiveServiceCount: services.filter((service) => !service.isActive).length,
    };
  };
}

export function createListAvailableSlots(repo: AvailabilityRepository) {
  return async function listAvailableSlots(input: {
    actor: BookingActor;
    professionalId: string;
    serviceId: string;
    localDate: string;
    now: Date;
    excludeAppointmentId?: string;
  }): Promise<string[]> {
    assertPermission(input.actor.role, "booking.read");
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }

    const snapshot = await repo.loadSnapshot(
      input.actor.tenantId,
      input.professionalId,
      input.serviceId,
      input.localDate,
      input.excludeAppointmentId,
    );
    if (!snapshot || !snapshot.professional || !snapshot.service) {
      notFound();
    }
    if (!snapshot.professional.serviceIds.includes(snapshot.service.id)) {
      throw new BookingError("VALIDATION", "SERVICE_NOT_OFFERED", "serviceId");
    }
    if (!snapshot.professional.isActive || !snapshot.service.isActive) {
      return [];
    }

    return offeredFromSnapshot(snapshot, input.localDate, input.now);
  };
}
