import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  AvailabilityRepository,
  AvailabilitySnapshot,
  OfferWindows,
} from "@/modules/booking/application/ports/availability-repository";
import { createListPublicDays } from "@/modules/booking/application/use-cases/list-public-days";
import { createListPublicSlots } from "@/modules/booking/application/use-cases/list-public-slots";
import { createPublicReservation } from "@/modules/booking/application/use-cases/public-reservation";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const serviceId = "svc-corte";
const now = new Date("2026-09-10T11:00:00.000Z");

const morning = { startTime: "09:00", endTime: "11:00", capacity: 1 };
const branchDay = { startTime: "09:00", endTime: "18:00", capacity: 1 };

function snapshotFor(professionalId: string, isActive: boolean): AvailabilitySnapshot {
  const late = professionalId === "pro-b";
  return {
    timezone: "America/Argentina/Buenos_Aires",
    professional: {
      id: professionalId,
      displayName: professionalId === "pro-a" ? "Ana" : "Luis",
      branchId: "branch-1",
      serviceIds: [serviceId],
      isActive,
    },
    service: {
      id: serviceId,
      name: "Corte",
      durationMinutes: 60,
      prepMinutes: 0,
      cleanupMinutes: 0,
      earliestStart: null,
      latestStart: null,
      isActive: true,
      priceAmount: 15000,
    },
    branchName: "Sede",
    professionalBands: [
      { dayOfWeek: 4, ...(late ? { startTime: "11:00", endTime: "13:00", capacity: 1 } : morning) },
    ],
    branchBands: [{ dayOfWeek: 4, ...branchDay }],
    blocks: [],
    appointments: [],
    branchAppointments: [],
  };
}

function offerOfA(): OfferWindows {
  return {
    timezone: "America/Argentina/Buenos_Aires",
    service: {
      durationMinutes: 60,
      prepMinutes: 0,
      cleanupMinutes: 0,
      earliestStart: null,
      latestStart: null,
      isActive: true,
    },
    occupations: [],
    windows: [
      {
        professionalId: "pro-a",
        branchId: "branch-1",
        isActive: true,
        professionalBands: [{ dayOfWeek: 4, ...morning }],
        branchBands: [{ dayOfWeek: 4, ...branchDay }],
        blocks: [
          {
            startDate: "2026-09-17",
            endDate: "2026-09-17",
            startTime: null,
            endTime: null,
            owner: "professional",
          },
        ],
      },
      {
        professionalId: "pro-luis",
        branchId: "branch-1",
        isActive: false,
        professionalBands: [{ dayOfWeek: 5, ...morning }],
        branchBands: [{ dayOfWeek: 5, ...branchDay }],
        blocks: [],
      },
    ],
  };
}

function harness() {
  const taken = new Set<string>();
  const reserved: { tenantId: string; professionalId: string }[] = [];
  const repo = {
    async listProfessionals(tenantId: string) {
      if (tenantId !== tenantA) {
        return [];
      }
      return [
        {
          id: "pro-b",
          displayName: "Luis",
          branchId: "branch-1",
          serviceIds: [serviceId],
          isActive: false,
        },
        {
          id: "pro-a",
          displayName: "Ana",
          branchId: "branch-1",
          serviceIds: [serviceId],
          isActive: true,
        },
        {
          id: "pro-c",
          displayName: "Sol",
          branchId: "branch-1",
          serviceIds: [serviceId],
          isActive: true,
        },
      ];
    },
    async listServices() {
      return [];
    },
    async loadSnapshot(_tenantId: string, professionalId: string) {
      if (professionalId === "pro-b") {
        return snapshotFor("pro-b", false);
      }
      if (professionalId === "pro-c") {
        return snapshotFor("pro-c", true);
      }
      return snapshotFor("pro-a", true);
    },
    async listOfferWindows(tenantId: string) {
      return tenantId === tenantA
        ? offerOfA()
        : {
            timezone: "America/Argentina/Buenos_Aires",
            service: null,
            occupations: [],
            windows: [],
          };
    },
    async findAppointment(_tenantId: string, appointmentId: string) {
      const professionalId = appointmentId.endsWith("pro-c") ? "pro-c" : "pro-a";
      return {
        id: appointmentId,
        localDate: "2026-09-10",
        localTime: "10:00",
        professionalId,
        serviceId,
        clientId: "client-1",
        status: "CONFIRMED",
        durationMinutes: 60,
        serviceName: "Corte",
        professionalName: professionalId === "pro-a" ? "Ana" : "Sol",
        clientFirstName: "Ana",
        clientLastName: null,
        clientPhone: "1112345678",
      };
    },
    async reserveSlot(input: {
      tenantId: string;
      professionalId: string;
      localDate: string;
      localTime: string;
      serviceId: string;
      clientId: string;
    }) {
      if (input.tenantId !== tenantA || input.professionalId === "pro-b") {
        return { status: "inactive" as const };
      }
      const key = `${input.professionalId}:${input.localTime}`;
      if (taken.has(key)) {
        return { status: "unavailable" as const };
      }
      taken.add(key);
      reserved.push({ tenantId: input.tenantId, professionalId: input.professionalId });
      return {
        status: "created" as const,
        appointment: {
          id: `appt-${input.professionalId}`,
          localDate: input.localDate,
          localTime: input.localTime,
          professionalId: input.professionalId,
          serviceId: input.serviceId,
          clientId: input.clientId,
        },
      };
    },
  } as unknown as AvailabilityRepository;

  return { repo, reserved, taken };
}

describe("oferta pública", () => {
  it("cualquier profesional une los huecos del negocio A y deja afuera al inactivo y al negocio B", async () => {
    const { repo } = harness();
    const listSlots = createListPublicSlots(repo);
    const slots = await listSlots({
      tenantId: tenantA,
      professionalId: null,
      serviceId,
      localDate: "2026-09-10",
      now,
    });
    assert.equal(slots.includes("10:00"), true);
    assert.equal(slots.includes("11:00"), false);

    const other = await listSlots({
      tenantId: tenantB,
      professionalId: null,
      serviceId,
      localDate: "2026-09-10",
      now,
    });
    assert.deepEqual(other, []);
  });

  it("los próximos 30 días abren solo donde hay franja y no un bloqueo de día completo", async () => {
    const { repo } = harness();
    const days = await createListPublicDays(repo)({
      tenantId: tenantA,
      serviceId,
      professionalId: null,
      now,
    });
    assert.equal(days.includes("2026-09-10"), true);
    assert.equal(days.includes("2026-09-17"), false);
    assert.equal(days.includes("2026-09-11"), false);
    assert.equal(days.includes("2026-10-08"), true);
    assert.equal(days.includes("2026-10-15"), false);
    assert.deepEqual(
      await createListPublicDays(repo)({
        tenantId: tenantB,
        serviceId,
        professionalId: null,
        now,
      }),
      [],
    );
  });

  it("no ofrece un día sin hueco, y cada profesional ve solo los días en los que atiende", async () => {
    const booked = {
      timezone: "America/Argentina/Buenos_Aires",
      service: {
        durationMinutes: 60,
        prepMinutes: 0,
        cleanupMinutes: 0,
        earliestStart: null,
        latestStart: null,
        isActive: true,
      },
      occupations: [
        {
          professionalId: "pro-a",
          branchId: "branch-1",
          localDate: "2026-09-10",
          localTime: "09:00",
          durationMinutes: 60,
        },
        {
          professionalId: "pro-a",
          branchId: "branch-1",
          localDate: "2026-09-10",
          localTime: "10:00",
          durationMinutes: 60,
        },
      ],
      windows: [
        {
          professionalId: "pro-a",
          branchId: "branch-1",
          isActive: true,
          professionalBands: [{ dayOfWeek: 4, ...morning }],
          branchBands: [{ dayOfWeek: 4, ...branchDay }],
          blocks: [],
        },
        {
          professionalId: "pro-c",
          branchId: "branch-1",
          isActive: true,
          professionalBands: [{ dayOfWeek: 5, ...morning }],
          branchBands: [{ dayOfWeek: 5, ...branchDay }],
          blocks: [],
        },
      ],
    };
    const repo = {
      async listOfferWindows(tenantId: string) {
        return tenantId === tenantA
          ? booked
          : { timezone: booked.timezone, service: booked.service, occupations: [], windows: [] };
      },
    } as unknown as AvailabilityRepository;
    const listDays = createListPublicDays(repo);

    const ana = await listDays({ tenantId: tenantA, serviceId, professionalId: "pro-a", now });
    assert.equal(ana.includes("2026-09-10"), false);
    assert.equal(ana.includes("2026-09-11"), false);
    assert.equal(ana.includes("2026-09-17"), true);

    const sol = await listDays({ tenantId: tenantA, serviceId, professionalId: "pro-c", now });
    assert.equal(sol.includes("2026-09-11"), true);
    assert.equal(sol.includes("2026-09-10"), false);
    assert.equal(sol.includes("2026-09-17"), false);

    const anyone = await listDays({ tenantId: tenantA, serviceId, professionalId: null, now });
    assert.equal(anyone.includes("2026-09-10"), false);
    assert.equal(anyone.includes("2026-09-11"), true);
    assert.equal(anyone.includes("2026-09-17"), true);

    assert.deepEqual(
      await listDays({ tenantId: tenantB, serviceId, professionalId: null, now }),
      [],
    );
  });

  it("cualquiera asigna al primer profesional libre y la segunda reserva pasa al siguiente", async () => {
    const { repo, reserved } = harness();
    const reserve = createPublicReservation(repo, {
      async save() {
        return { clientId: "client-1" };
      },
    });
    const input = {
      tenantId: tenantA,
      professionalId: null,
      serviceId,
      localDate: "2026-09-10",
      localTime: "10:00",
      phone: "1112345678",
      firstName: "Ana",
      whatsappConsent: true,
      now,
    };
    const first = await reserve(input);
    const second = await reserve(input);
    assert.equal(first.status, "confirmed");
    assert.equal(second.status, "confirmed");
    if (first.status === "confirmed" && second.status === "confirmed") {
      assert.equal(first.professionalId, "pro-a");
      assert.equal(first.serviceName, "Corte");
      assert.equal(second.professionalId, "pro-c");
    }
    assert.deepEqual(
      reserved.map((row) => row.professionalId),
      ["pro-a", "pro-c"],
    );
    assert.equal(
      reserved.every((row) => row.tenantId === tenantA),
      true,
    );
  });
});
