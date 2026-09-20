import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BookingError } from "@/modules/booking/application/errors";
import { emptySlotsReason } from "@/modules/booking/application/offered-from-snapshot";
import type { AvailabilityRepository } from "@/modules/booking/application/ports/availability-repository";
import { createListAvailableSlots } from "@/modules/booking/application/use-cases/list-available-slots";
import { listOfferedSlots } from "@/modules/booking/domain/list-offered-slots";
import {
  addLocalDays,
  formatDurationLabel,
  localDateTimeToUtc,
  zonedCivilNow,
} from "@/modules/booking/domain/time";

const anaMorning = { startTime: "09:00", endTime: "11:30", capacity: 2 };
const anaAfternoon = { startTime: "11:30", endTime: "18:00", capacity: 1 };
const branchDay = { startTime: "09:00", endTime: "19:00", capacity: 3 };

const corte = {
  durationMinutes: 45,
  prepMinutes: 0,
  cleanupMinutes: 5,
  earliestStart: null as string | null,
  latestStart: null as string | null,
};

function weekdayInput(
  extra: Partial<Parameters<typeof listOfferedSlots>[0]> = {},
): Parameters<typeof listOfferedSlots>[0] {
  return {
    localDate: "2026-08-25",
    todayLocalDate: "2026-08-24",
    nowMinuteOfDay: 0,
    ...corte,
    professionalBands: [anaMorning, anaAfternoon],
    branchBands: [branchDay],
    blocks: [],
    professionalOccupations: [],
    branchOccupations: [],
    ...extra,
  };
}

describe("zonedCivilNow", () => {
  it("convierte un instante UTC a fecha y minuto local de Buenos Aires", () => {
    const civil = zonedCivilNow(
      "America/Argentina/Buenos_Aires",
      new Date("2026-08-26T14:30:00.000Z"),
    );
    assert.equal(civil.localDate, "2026-08-26");
    assert.equal(civil.minuteOfDay, 11 * 60 + 30);
  });
});

describe("addLocalDays", () => {
  it("avanza al día siguiente al cierre de mes", () => {
    assert.equal(addLocalDays("2026-08-31", 1), "2026-09-01");
  });
});

describe("formatDurationLabel", () => {
  it("formatea minutos, horas exactas y horas con resto", () => {
    assert.equal(formatDurationLabel(50), "50 min");
    assert.equal(formatDurationLabel(60), "1 h");
    assert.equal(formatDurationLabel(90), "1 h 30 min");
  });
});

describe("localDateTimeToUtc", () => {
  it("convierte civil de Buenos Aires al instante UTC derivado", () => {
    const instant = localDateTimeToUtc("2026-08-26", "10:30", "America/Argentina/Buenos_Aires");
    assert.equal(instant.toISOString(), "2026-08-26T13:30:00.000Z");
  });
});

describe("listOfferedSlots", () => {
  it("ofrece inicios cada 15 minutos alineados a la franja, hasta donde entra el servicio", () => {
    const slots = listOfferedSlots(weekdayInput());
    assert.equal(slots[0], "09:00");
    assert.equal(slots[1], "09:15");
    assert.equal(slots.at(-1), "17:00");
    assert.equal(slots.includes("17:15"), false);
    assert.equal(slots.length, 33);
  });

  it("respeta latestStart del servicio", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        durationMinutes: 90,
        prepMinutes: 10,
        cleanupMinutes: 10,
        earliestStart: "09:00",
        latestStart: "16:00",
      }),
    );
    assert.equal(slots[0], "09:00");
    assert.equal(slots.at(-1), "16:00");
    assert.equal(slots.includes("16:15"), false);
  });

  it("no ofrece un día anterior a hoy", () => {
    const slots = listOfferedSlots(
      weekdayInput({ localDate: "2026-08-20", todayLocalDate: "2026-08-26" }),
    );
    assert.equal(slots.length, 0);
  });

  it("omite inicios que ya pasaron hoy", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        localDate: "2026-08-26",
        todayLocalDate: "2026-08-26",
        nowMinuteOfDay: 11 * 60 + 20,
      }),
    );
    assert.equal(slots[0], "11:30");
    assert.equal(slots.includes("11:15"), false);
  });

  it("no atraviesa un hueco entre franjas", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        durationMinutes: 60,
        prepMinutes: 0,
        cleanupMinutes: 0,
        professionalBands: [
          { startTime: "09:00", endTime: "13:00", capacity: 1 },
          { startTime: "14:00", endTime: "18:00", capacity: 1 },
        ],
      }),
    );
    assert.equal(slots.includes("12:15"), false);
    assert.equal(slots.includes("12:00"), true);
    assert.equal(slots.includes("14:00"), true);
  });

  it("excluye un bloqueo con horario", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        blocks: [{ start: 12 * 60, end: 14 * 60 }],
      }),
    );
    assert.equal(slots.includes("11:00"), true);
    assert.equal(slots.includes("11:15"), false);
    assert.equal(slots.includes("13:45"), false);
    assert.equal(slots.includes("14:00"), true);
  });

  it("deja entrar un segundo turno a la mañana con capacidad 2", () => {
    const own = { start: 9 * 60, end: 9 * 60 + 50 };
    const slots = listOfferedSlots(
      weekdayInput({
        professionalOccupations: [own],
        branchOccupations: [own],
      }),
    );
    assert.equal(slots.includes("09:00"), true);
  });

  it("agota la capacidad 2 de la mañana", () => {
    const own = { start: 9 * 60, end: 9 * 60 + 50 };
    const slots = listOfferedSlots(
      weekdayInput({
        professionalOccupations: [own, own],
        branchOccupations: [own, own],
      }),
    );
    assert.equal(slots.includes("09:00"), false);
    assert.equal(slots.includes("09:45"), false);
    assert.equal(slots.includes("10:00"), true);
  });

  it("un turno de otra persona llena el local de capacidad 1", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        branchBands: [{ startTime: "09:00", endTime: "19:00", capacity: 1 }],
        branchOccupations: [{ start: 9 * 60, end: 9 * 60 + 50 }],
      }),
    );
    assert.equal(slots.includes("09:00"), false);
    assert.equal(slots.includes("10:00"), true);
  });

  it("con local de 3, tres solapados tapan el cuarto y otra hora sigue libre", () => {
    const chair = { start: 9 * 60, end: 9 * 60 + 50 };
    const slots = listOfferedSlots(
      weekdayInput({
        branchOccupations: [chair, chair, chair],
      }),
    );
    assert.equal(slots.includes("09:00"), false);
    assert.equal(slots.includes("10:00"), true);
  });

  it("un turno de otra persona no llena la capacidad del profesional", () => {
    const slots = listOfferedSlots(
      weekdayInput({
        professionalBands: [{ startTime: "09:00", endTime: "18:00", capacity: 1 }],
        branchOccupations: [{ start: 9 * 60, end: 9 * 60 + 50 }],
      }),
    );
    assert.equal(slots.includes("09:00"), true);
  });

  it("rechaza un inicio que cruza a una franja ya llena", () => {
    const own = { start: 11 * 60 + 30, end: 12 * 60 + 30 };
    const slots = listOfferedSlots(
      weekdayInput({
        professionalOccupations: [own],
        branchOccupations: [own],
      }),
    );
    assert.equal(slots.includes("10:30"), true);
    assert.equal(slots.includes("10:45"), false);
    assert.equal(slots.includes("11:15"), false);
  });
});

describe("listAvailableSlots", () => {
  const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const professionalA = "11111111-1111-1111-1111-111111111111";
  const serviceA = "22222222-2222-2222-2222-222222222222";

  function repo(): AvailabilityRepository {
    return {
      async listProfessionals() {
        return [];
      },
      async listServices() {
        return [];
      },
      async loadSnapshot() {
        return {
          timezone: "America/Argentina/Buenos_Aires",
          professional: {
            id: professionalA,
            displayName: "Ana",
            branchId: "branch",
            serviceIds: [serviceA],
            isActive: true,
          },
          service: {
            id: serviceA,
            name: "Corte de dama",
            durationMinutes: 45,
            prepMinutes: 0,
            cleanupMinutes: 5,
            earliestStart: null,
            latestStart: null,
            isActive: true,
            priceAmount: 8000,
          },
          professionalBands: [
            { dayOfWeek: 2, ...anaMorning },
            { dayOfWeek: 2, ...anaAfternoon },
          ],
          branchBands: [{ dayOfWeek: 2, ...branchDay }],
          branchName: "Sede principal",
          blocks: [],
          appointments: [],
          branchAppointments: [],
        };
      },
      async findAppointment() {
        return null;
      },
      async reserveSlot() {
        throw new Error("reserveSlot is not used in these tests");
      },
      async rescheduleSlot() {
        throw new Error("rescheduleSlot is not used in these tests");
      },
      async listDayAppointments() {
        return [];
      },
      async listMonthAppointments() {
        return [];
      },
      async listMonthBlocks() {
        return [];
      },
      async cancelAppointment() {
        throw new Error("cancelAppointment is not used in these tests");
      },
      async markNoShow() {
        throw new Error("markNoShow is not used in these tests");
      },
      async markCompleted() {
        throw new Error("markCompleted is not used in these tests");
      },
    };
  }

  it("lista huecos de un martes para un corte de Ana", async () => {
    const listAvailableSlots = createListAvailableSlots(repo());
    const slots = await listAvailableSlots({
      actor: { tenantId: tenantA, role: "RECEPTION" },
      professionalId: professionalA,
      serviceId: serviceA,
      localDate: "2026-08-25",
      now: new Date("2026-08-24T12:00:00.000Z"),
    });
    assert.equal(slots[0], "09:00");
    assert.equal(slots.at(-1), "17:00");
  });

  it("rechaza un servicio que el profesional no ofrece", async () => {
    const closed: AvailabilityRepository = {
      ...repo(),
      async loadSnapshot() {
        const snapshot = await repo().loadSnapshot("t", "p", "s", "d");
        assert.ok(snapshot?.professional);
        snapshot.professional.serviceIds = [];
        return snapshot;
      },
    };
    const listAvailableSlots = createListAvailableSlots(closed);
    await assert.rejects(
      () =>
        listAvailableSlots({
          actor: { tenantId: tenantA, role: "OWNER" },
          professionalId: professionalA,
          serviceId: serviceA,
          localDate: "2026-08-25",
          now: new Date("2026-08-24T12:00:00.000Z"),
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SERVICE_NOT_OFFERED",
    );
  });
});

describe("emptySlotsReason", () => {
  const snapshot = {
    timezone: "America/Argentina/Buenos_Aires",
    professional: {
      id: "11111111-1111-1111-1111-111111111111",
      displayName: "Ana",
      branchId: "branch",
      serviceIds: ["22222222-2222-2222-2222-222222222222"],
      isActive: true,
    },
    service: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Corte de dama",
      durationMinutes: 45,
      prepMinutes: 0,
      cleanupMinutes: 5,
      earliestStart: null,
      latestStart: null,
      isActive: true,
      priceAmount: 8000,
    },
    professionalBands: [
      { dayOfWeek: 3, ...anaMorning },
      { dayOfWeek: 3, ...anaAfternoon },
    ],
    branchBands: [{ dayOfWeek: 3, ...branchDay }],
    branchName: "Sede principal",
    blocks: [],
    appointments: [],
    branchAppointments: [],
  };

  it("dice que hoy ya terminó cuando la hora local pasó el fin de la última franja", () => {
    assert.equal(
      emptySlotsReason(snapshot, "2026-08-26", new Date("2026-08-27T00:10:00.000Z")),
      "TODAY_ENDED",
    );
  });

  it("marca un día anterior", () => {
    assert.equal(
      emptySlotsReason(snapshot, "2026-08-25", new Date("2026-08-26T12:00:00.000Z")),
      "PAST_DATE",
    );
  });

  it("marca falta de horario del profesional ese día", () => {
    assert.equal(
      emptySlotsReason(
        { ...snapshot, professionalBands: [] },
        "2026-08-27",
        new Date("2026-08-26T12:00:00.000Z"),
      ),
      "NO_PROFESSIONAL_HOURS",
    );
  });

  it("marca un bloqueo de sucursal de día completo", () => {
    assert.equal(
      emptySlotsReason(
        {
          ...snapshot,
          blocks: [
            {
              startDate: "2026-08-26",
              endDate: "2026-08-26",
              startTime: null,
              endTime: null,
              owner: "branch",
            },
          ],
        },
        "2026-08-26",
        new Date("2026-08-25T12:00:00.000Z"),
      ),
      "BRANCH_BLOCKED",
    );
  });

  it("no trata como sucursal un bloqueo de día completo de la persona", () => {
    assert.equal(
      emptySlotsReason(
        {
          ...snapshot,
          blocks: [
            {
              startDate: "2026-08-26",
              endDate: "2026-08-26",
              startTime: null,
              endTime: null,
              owner: "professional",
            },
          ],
        },
        "2026-08-26",
        new Date("2026-08-25T12:00:00.000Z"),
      ),
      "NONE_FIT",
    );
  });
});
