import { isLocalDate } from "../../domain/time";
import { BookingError, notFound } from "../errors";
import { offeredFromSnapshot } from "../offered-from-snapshot";
import type { AvailabilityRepository } from "../ports/availability-repository";

export function createListPublicCatalog(repo: AvailabilityRepository) {
  return async function listPublicCatalog(tenantId: string) {
    const [professionals, services] = await Promise.all([
      repo.listProfessionals(tenantId),
      repo.listServices(tenantId),
    ]);
    return {
      professionals: professionals
        .filter((professional) => professional.isActive)
        .map((professional) => ({
          id: professional.id,
          displayName: professional.displayName,
          serviceIds: professional.serviceIds,
        })),
      services: services
        .filter((service) => service.isActive)
        .map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceAmount: service.priceAmount,
        })),
    };
  };
}

async function slotsForProfessional(
  repo: AvailabilityRepository,
  input: {
    tenantId: string;
    professionalId: string;
    serviceId: string;
    localDate: string;
    now: Date;
  },
): Promise<string[]> {
  const snapshot = await repo.loadSnapshot(
    input.tenantId,
    input.professionalId,
    input.serviceId,
    input.localDate,
  );
  if (!snapshot?.professional || !snapshot.service) {
    notFound();
  }
  if (!snapshot.professional.serviceIds.includes(snapshot.service.id)) {
    throw new BookingError("VALIDATION", "SERVICE_NOT_OFFERED", "serviceId");
  }
  if (!snapshot.professional.isActive || !snapshot.service.isActive) {
    return [];
  }
  return offeredFromSnapshot(snapshot, input.localDate, input.now);
}

export function createListPublicSlots(repo: AvailabilityRepository) {
  return async function listPublicSlots(input: {
    tenantId: string;
    professionalId: string | null;
    serviceId: string;
    localDate: string;
    now: Date;
  }): Promise<string[]> {
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }
    if (input.professionalId) {
      return slotsForProfessional(repo, { ...input, professionalId: input.professionalId });
    }
    const professionals = (await repo.listProfessionals(input.tenantId))
      .filter(
        (professional) =>
          professional.isActive && professional.serviceIds.includes(input.serviceId),
      )
      .sort((left, right) => left.id.localeCompare(right.id));
    const offered = await Promise.all(
      professionals.map((professional) =>
        slotsForProfessional(repo, { ...input, professionalId: professional.id }),
      ),
    );
    return [...new Set(offered.flat())].sort();
  };
}
