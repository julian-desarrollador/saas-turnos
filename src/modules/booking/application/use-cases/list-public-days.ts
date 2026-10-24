import { publicBookableDates } from "../../domain/public-open-dates";
import { zonedCivilNow } from "../../domain/time";
import type { AvailabilityRepository } from "../ports/availability-repository";

export function createListPublicDays(repo: AvailabilityRepository) {
  return async function listPublicDays(input: {
    tenantId: string;
    serviceId: string;
    professionalId: string | null;
    now: Date;
  }): Promise<string[]> {
    const offer = await repo.listOfferWindows(input.tenantId, input.serviceId, input.now);
    if (!offer) {
      return [];
    }
    const civil = zonedCivilNow(offer.timezone, input.now);
    const windows = offer.windows.filter(
      (window) => input.professionalId === null || window.professionalId === input.professionalId,
    );
    return publicBookableDates({
      today: civil.localDate,
      nowMinuteOfDay: civil.minuteOfDay,
      service: offer.service,
      windows,
      occupations: offer.occupations,
    });
  };
}
