import { normalizePhone } from "@/modules/clients/domain/phone";

import { isLocalDate, isLocalTime } from "../../domain/time";
import type { AvailabilityRepository } from "../ports/availability-repository";

const NAME_MAX = 100;

export type PublicReservationResult =
  | {
      status: "confirmed";
      localDate: string;
      localTime: string;
      appointmentId: string;
      professionalId: string;
      professionalName: string;
      serviceName: string;
    }
  | { status: "unavailable" }
  | { status: "invalid" };

export type PublicClientDirectory = {
  save(input: {
    tenantId: string;
    phone: string;
    firstName: string;
    consentedAt: Date;
  }): Promise<{ clientId: string }>;
};

export function createPublicReservation(
  repo: AvailabilityRepository,
  clients: PublicClientDirectory,
) {
  return async function publicReservation(input: {
    tenantId: string;
    professionalId: string | null;
    serviceId: string;
    localDate: string;
    localTime: string;
    phone: string;
    firstName: string;
    whatsappConsent: boolean;
    now: Date;
    publicDeviceHash?: string | null;
  }): Promise<PublicReservationResult> {
    const phone = normalizePhone(input.phone);
    const firstName = input.firstName.trim();
    if (!input.whatsappConsent || !phone || !firstName || firstName.length > NAME_MAX) {
      return { status: "invalid" };
    }
    if (!isLocalDate(input.localDate) || !isLocalTime(input.localTime)) {
      return { status: "invalid" };
    }

    const saved = await clients.save({
      tenantId: input.tenantId,
      phone,
      firstName,
      consentedAt: input.now,
    });
    const professionalIds = input.professionalId
      ? [input.professionalId]
      : (await repo.listProfessionals(input.tenantId))
          .filter(
            (professional) =>
              professional.isActive && professional.serviceIds.includes(input.serviceId),
          )
          .map((professional) => professional.id)
          .sort((left, right) => left.localeCompare(right));

    for (const professionalId of professionalIds) {
      const reserved = await repo.reserveSlot({
        tenantId: input.tenantId,
        professionalId,
        serviceId: input.serviceId,
        clientId: saved.clientId,
        localDate: input.localDate,
        localTime: input.localTime,
        now: input.now,
        origin: "PUBLIC",
        publicDeviceHash: input.publicDeviceHash ?? null,
      });
      if (reserved.status !== "created") {
        continue;
      }
      const detail = await repo.findAppointment(input.tenantId, reserved.appointment.id);
      return {
        status: "confirmed",
        localDate: reserved.appointment.localDate,
        localTime: reserved.appointment.localTime,
        appointmentId: reserved.appointment.id,
        professionalId: reserved.appointment.professionalId,
        professionalName: detail?.professionalName ?? "",
        serviceName: detail?.serviceName ?? "",
      };
    }
    return { status: "unavailable" };
  };
}
