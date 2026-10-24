import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createPublicReservation } from "@/modules/booking/application/use-cases/public-reservation";
import type { AvailabilityRepository } from "@/modules/booking/application/ports/availability-repository";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const now = new Date("2026-09-10T15:00:00.000Z");

function reservationHarness() {
  const calls: {
    tenantId: string;
    clientId: string;
    origin: string;
    publicDeviceHash: string | null;
  }[] = [];
  const knownPhones = new Set<string>();
  const repo = {
    async reserveSlot(input: {
      tenantId: string;
      professionalId: string;
      serviceId: string;
      clientId: string;
      localDate: string;
      localTime: string;
      origin?: string;
      publicDeviceHash?: string | null;
    }) {
      if (input.tenantId === tenantB) {
        return { status: "not_found" as const };
      }
      if (input.localTime === "18:00") {
        return { status: "unavailable" as const };
      }
      calls.push({
        tenantId: input.tenantId,
        clientId: input.clientId,
        origin: input.origin ?? "PANEL",
        publicDeviceHash: input.publicDeviceHash ?? null,
      });
      return {
        status: "created" as const,
        appointment: {
          id: "appt-1",
          localDate: input.localDate,
          localTime: input.localTime,
          professionalId: input.professionalId,
          serviceId: input.serviceId,
          clientId: input.clientId,
        },
      };
    },
    async findAppointment() {
      return {
        id: "appt-1",
        localDate: "2026-09-11",
        localTime: "10:00",
        professionalId: "pro-1",
        serviceId: "svc-1",
        clientId: "client-new",
        status: "CONFIRMED",
        durationMinutes: 60,
        serviceName: "Corte",
        professionalName: "Ana",
        clientFirstName: "Ana",
        clientLastName: null,
        clientPhone: "1112345678",
      };
    },
  } as unknown as AvailabilityRepository;

  const clients = {
    async save(input: { tenantId: string; phone: string; firstName: string; consentedAt: Date }) {
      const existed = knownPhones.has(`${input.tenantId}:${input.phone}`);
      knownPhones.add(`${input.tenantId}:${input.phone}`);
      return { clientId: existed ? "client-known" : "client-new" };
    },
  };

  return {
    calls,
    reserve: createPublicReservation(repo, clients),
  };
}

const base = {
  tenantId: tenantA,
  professionalId: "pro-1",
  serviceId: "svc-1",
  localDate: "2026-09-11",
  localTime: "10:00",
  phone: "1112345678",
  firstName: "Ana",
  whatsappConsent: true,
  now,
};

describe("reserva pública", () => {
  it("responde igual si el teléfono ya era cliente de ese negocio", async () => {
    const { reserve, calls } = reservationHarness();
    const first = await reserve(base);
    const second = await reserve(base);
    assert.deepEqual(first, second);
    assert.equal(first.status, "confirmed");
    assert.equal("existed" in first, false);
    assert.equal(calls[0]?.origin, "PUBLIC");
    assert.equal(calls[0]?.publicDeviceHash, null);
    assert.notEqual(calls[0]?.clientId, calls[1]?.clientId);
  });

  it("no reserva un turno en otro negocio", async () => {
    const { reserve, calls } = reservationHarness();
    const result = await reserve({ ...base, tenantId: tenantB });
    assert.equal(result.status, "unavailable");
    assert.equal(calls.length, 0);
  });

  it("guarda la clave del celular en el turno", async () => {
    const { reserve, calls } = reservationHarness();
    await reserve({ ...base, publicDeviceHash: "abc123" });
    assert.equal(calls[0]?.publicDeviceHash, "abc123");
  });

  it("no reserva si no acepta el aviso por WhatsApp", async () => {
    const { reserve, calls } = reservationHarness();
    const result = await reserve({ ...base, whatsappConsent: false });
    assert.equal(result.status, "invalid");
    assert.equal(calls.length, 0);
  });

  it("no dice que el horario falta de otra forma cuando el cupo se acabó", async () => {
    const { reserve } = reservationHarness();
    const missing = await reserve({ ...base, localTime: "18:00" });
    const other = await reserve({ ...base, tenantId: tenantB, localTime: "18:00" });
    assert.deepEqual(missing, { status: "unavailable" });
    assert.deepEqual(other, { status: "unavailable" });
  });
});
