import { localDateTimeToUtc } from "../domain/time";

import { occupancyMinutes, offeredFromSnapshot } from "./offered-from-snapshot";
import type { AvailabilitySnapshot } from "./ports/availability-repository";

export type ReservationReady = {
  status: "ok";
  occupancyMinutes: number;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  branchId: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceAmount: number;
  };
};

export type ReservationEvaluation =
  | ReservationReady
  | { status: "not_found" }
  | { status: "service_not_offered" }
  | { status: "inactive" }
  | { status: "unavailable" };

export function evaluateReservation(
  snapshot: AvailabilitySnapshot | null,
  localDate: string,
  localTime: string,
  now: Date,
): ReservationEvaluation {
  if (!snapshot || !snapshot.professional || !snapshot.service) {
    return { status: "not_found" };
  }
  if (!snapshot.professional.serviceIds.includes(snapshot.service.id)) {
    return { status: "service_not_offered" };
  }
  if (!snapshot.professional.isActive || !snapshot.service.isActive) {
    return { status: "inactive" };
  }

  const offered = offeredFromSnapshot(snapshot, localDate, now);
  if (!offered.includes(localTime)) {
    return { status: "unavailable" };
  }

  const occupancy = occupancyMinutes(snapshot.service);
  const startsAt = localDateTimeToUtc(localDate, localTime, snapshot.timezone);
  const endsAt = new Date(startsAt.getTime() + occupancy * 60_000);

  return {
    status: "ok",
    occupancyMinutes: occupancy,
    startsAt,
    endsAt,
    timezone: snapshot.timezone,
    branchId: snapshot.professional.branchId,
    service: {
      id: snapshot.service.id,
      name: snapshot.service.name,
      durationMinutes: snapshot.service.durationMinutes,
      priceAmount: snapshot.service.priceAmount,
    },
  };
}
