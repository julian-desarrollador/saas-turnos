import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryAvailabilityRepository } from "@/modules/booking/adapters/outbound/memory-availability-repository";
import { BookingError } from "@/modules/booking/application/errors";
import type { AvailabilitySnapshot } from "@/modules/booking/application/ports/availability-repository";
import { createCancelAppointment } from "@/modules/booking/application/use-cases/cancel-appointment";
import { createCreateAppointment } from "@/modules/booking/application/use-cases/create-appointment";
import { createListAvailableSlots } from "@/modules/booking/application/use-cases/list-available-slots";
import { createListRescheduleProfessionals } from "@/modules/booking/application/use-cases/list-reschedule-professionals";
import {
  createListDayAppointments,
  occupancyEndTime,
} from "@/modules/booking/application/use-cases/list-day-appointments";
import { createMarkCompleted } from "@/modules/booking/application/use-cases/mark-completed";
import { createMarkNoShow } from "@/modules/booking/application/use-cases/mark-no-show";
import { createRescheduleAppointment } from "@/modules/booking/application/use-cases/reschedule-appointment";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const professionalA = "11111111-1111-1111-1111-111111111111";
const professionalB = "44444444-4444-4444-4444-444444444444";
const serviceA = "22222222-2222-2222-2222-222222222222";
const clientA = "33333333-3333-3333-3333-333333333333";
const actor = { tenantId: tenantA, role: "RECEPTION" as const };
const tuesdayMorning = new Date("2026-08-24T12:00:00.000Z");

function snapshot(overrides: Partial<AvailabilitySnapshot> = {}): AvailabilitySnapshot {
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
    professionalBands: [{ dayOfWeek: 2, startTime: "09:00", endTime: "11:30", capacity: 1 }],
    branchBands: [{ dayOfWeek: 2, startTime: "09:00", endTime: "19:00", capacity: 3 }],
    branchName: "Sede principal",
    blocks: [],
    appointments: [],
    branchAppointments: [],
    ...overrides,
  };
}

function teamRepo(branchCapacity = 3) {
  const base = snapshot({
    branchBands: [{ dayOfWeek: 2, startTime: "09:00", endTime: "19:00", capacity: branchCapacity }],
  });
  const professional = base.professional;
  if (!professional) {
    throw new Error("fixture requires a professional");
  }
  return createMemoryAvailabilityRepository({
    snapshot: base,
    professionals: [
      professional,
      {
        id: professionalB,
        displayName: "Beto",
        branchId: "branch",
        serviceIds: [serviceA],
        isActive: true,
      },
    ],
  });
}

describe("occupancyEndTime", () => {
  it("suma la ocupación al inicio civil", () => {
    assert.equal(occupancyEndTime("15:00", 50), "15:50");
  });
});

describe("listDayAppointments", () => {
  it("lista los turnos del profesional en ese día y omite otro día u otro profesional", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "15:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte de dama",
          clientFirstName: "Lucía",
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
          professionalId: professionalA,
          localDate: "2026-08-26",
          localTime: "10:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte de dama",
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491188888888",
        },
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
          professionalId: "99999999-9999-9999-9999-999999999999",
          localDate: "2026-08-25",
          localTime: "11:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte de dama",
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491177777777",
        },
      ],
    });
    const listDayAppointments = createListDayAppointments(repo);
    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.localTime, "15:00");
    assert.equal(rows[0]?.endTime, "15:50");
    assert.equal(rows[0]?.clientFirstName, "Lucía");
  });

  it("incluye el turno recién confirmado", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const listDayAppointments = createListDayAppointments(repo);
    await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "10:30",
      now: tuesdayMorning,
    });
    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.localTime, "10:30");
    assert.equal(rows[0]?.serviceName, "Corte de dama");
  });
});

describe("createAppointment", () => {
  it("confirma un hueco libre y deja ocupación de duración más limpieza", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "10:30",
      now: tuesdayMorning,
    });
    assert.equal(created.localTime, "10:30");
    assert.equal(created.clientId, clientA);

    const after = await repo.loadSnapshot(tenantA, professionalA, serviceA, "2026-08-25");
    assert.equal(after?.appointments[0]?.durationMinutes, 50);
    assert.equal(after?.appointments[0]?.localTime, "10:30");
  });

  it("rechaza el segundo turno cuando el cupo ya está tomado", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await assert.rejects(
      () =>
        createAppointment({
          actor,
          professionalId: professionalA,
          serviceId: serviceA,
          clientId: clientA,
          localDate: "2026-08-25",
          localTime: "09:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SLOT_UNAVAILABLE",
    );
  });

  it("con local de 1, otro profesional no entra a la misma hora y sí a una libre", async () => {
    const repo = teamRepo(1);
    const createAppointment = createCreateAppointment(repo);
    const listAvailableSlots = createListAvailableSlots(repo);
    await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await assert.rejects(
      () =>
        createAppointment({
          actor,
          professionalId: professionalB,
          serviceId: serviceA,
          clientId: clientA,
          localDate: "2026-08-25",
          localTime: "09:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SLOT_UNAVAILABLE",
    );

    const slots = await listAvailableSlots({
      actor,
      professionalId: professionalB,
      serviceId: serviceA,
      localDate: "2026-08-25",
      now: tuesdayMorning,
    });
    assert.equal(slots.includes("09:00"), false);
    assert.equal(slots.includes("10:00"), true);

    const later = await createAppointment({
      actor,
      professionalId: professionalB,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "10:00",
      now: tuesdayMorning,
    });
    assert.equal(later.professionalId, professionalB);
    assert.equal(later.localTime, "10:00");
  });

  it("rechaza un horario mal formado", async () => {
    const createAppointment = createCreateAppointment(
      createMemoryAvailabilityRepository({ snapshot: snapshot() }),
    );
    await assert.rejects(
      () =>
        createAppointment({
          actor,
          professionalId: professionalA,
          serviceId: serviceA,
          clientId: clientA,
          localDate: "2026-08-25",
          localTime: "9:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "TIME_INVALID",
    );
  });
});

describe("cancelAppointment", () => {
  it("libera el hueco y saca el turno de la lista del día", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const cancelAppointment = createCancelAppointment(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    await cancelAppointment({ actor, appointmentId: created.id });

    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 0);

    const occupying = await repo.loadSnapshot(tenantA, professionalA, serviceA, "2026-08-25");
    assert.equal(occupying?.appointments.length, 0);

    const again = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    assert.equal(again.localTime, "09:00");
  });

  it("rechaza cancelar dos veces el mismo turno", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const cancelAppointment = createCancelAppointment(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await cancelAppointment({ actor, appointmentId: created.id });
    await assert.rejects(
      () => cancelAppointment({ actor, appointmentId: created.id }),
      (error: unknown) => error instanceof BookingError && error.reason === "ALREADY_CANCELLED",
    );
  });

  it("no cancela un turno ya atendido", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:00",
          durationMinutes: 50,
          status: "COMPLETED",
          serviceName: "Corte de dama",
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
      ],
    });
    const cancelAppointment = createCancelAppointment(repo);
    await assert.rejects(
      () =>
        cancelAppointment({
          actor,
          appointmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "NOT_CANCELLABLE",
    );
  });
});

describe("markNoShow", () => {
  it("libera el hueco y saca el turno de la lista del día", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const markNoShow = createMarkNoShow(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    await markNoShow({ actor, appointmentId: created.id });

    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 0);

    const occupying = await repo.loadSnapshot(tenantA, professionalA, serviceA, "2026-08-25");
    assert.equal(occupying?.appointments.length, 0);

    const again = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    assert.equal(again.localTime, "09:00");
  });

  it("rechaza marcar ausente dos veces", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const markNoShow = createMarkNoShow(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await markNoShow({ actor, appointmentId: created.id });
    await assert.rejects(
      () => markNoShow({ actor, appointmentId: created.id }),
      (error: unknown) => error instanceof BookingError && error.reason === "ALREADY_NO_SHOW",
    );
  });

  it("no marca ausente un turno ya atendido", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:00",
          durationMinutes: 50,
          status: "COMPLETED",
          serviceName: "Corte de dama",
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
      ],
    });
    const markNoShow = createMarkNoShow(repo);
    await assert.rejects(
      () =>
        markNoShow({
          actor,
          appointmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "NOT_NO_SHOWABLE",
    );
  });
});

describe("markCompleted", () => {
  it("deja el turno en la lista del día y sigue ocupando el hueco", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const markCompleted = createMarkCompleted(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    await markCompleted({ actor, appointmentId: created.id });

    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.status, "COMPLETED");

    const occupying = await repo.loadSnapshot(tenantA, professionalA, serviceA, "2026-08-25");
    assert.equal(occupying?.appointments.length, 1);

    await assert.rejects(
      () =>
        createAppointment({
          actor,
          professionalId: professionalA,
          serviceId: serviceA,
          clientId: clientA,
          localDate: "2026-08-25",
          localTime: "09:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SLOT_UNAVAILABLE",
    );
  });

  it("rechaza marcar atendido dos veces", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const markCompleted = createMarkCompleted(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await markCompleted({ actor, appointmentId: created.id });
    await assert.rejects(
      () => markCompleted({ actor, appointmentId: created.id }),
      (error: unknown) => error instanceof BookingError && error.reason === "ALREADY_COMPLETED",
    );
  });

  it("no marca atendido un turno cancelado", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:00",
          durationMinutes: 50,
          status: "CANCELLED",
          serviceName: "Corte de dama",
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
      ],
    });
    const markCompleted = createMarkCompleted(repo);
    await assert.rejects(
      () =>
        markCompleted({
          actor,
          appointmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "NOT_COMPLETABLE",
    );
  });
});

describe("rescheduleAppointment", () => {
  function teamSnapshot() {
    return teamRepo();
  }

  it("mueve a otro horario del mismo profesional y libera el cupo viejo", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    const moved = await rescheduleAppointment({
      actor,
      appointmentId: created.id,
      professionalId: professionalA,
      localDate: "2026-08-25",
      localTime: "10:30",
      now: tuesdayMorning,
    });
    assert.equal(moved.id, created.id);
    assert.equal(moved.localTime, "10:30");

    const rows = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.localTime, "10:30");

    const again = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    assert.equal(again.localTime, "09:00");
  });

  it("mueve a otro día del mismo profesional", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    const moved = await rescheduleAppointment({
      actor,
      appointmentId: created.id,
      professionalId: professionalA,
      localDate: "2026-09-01",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    assert.equal(moved.localDate, "2026-09-01");

    const origin = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    const destination = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-09-01",
    });
    assert.equal(origin.length, 0);
    assert.equal(destination.length, 1);
    assert.equal(destination[0]?.id, created.id);
  });

  it("ignora el propio turno en el recuento al mover a un hueco que se solapa", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const listAvailableSlots = createListAvailableSlots(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    const withoutExclude = await listAvailableSlots({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      localDate: "2026-08-25",
      now: tuesdayMorning,
    });
    assert.equal(withoutExclude.includes("09:15"), false);

    const withExclude = await listAvailableSlots({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      localDate: "2026-08-25",
      now: tuesdayMorning,
      excludeAppointmentId: created.id,
    });
    assert.equal(withExclude.includes("09:15"), true);

    const moved = await rescheduleAppointment({
      actor,
      appointmentId: created.id,
      professionalId: professionalA,
      localDate: "2026-08-25",
      localTime: "09:15",
      now: tuesdayMorning,
    });
    assert.equal(moved.id, created.id);
    assert.equal(moved.localTime, "09:15");
  });

  it("cambia de profesional cuando el destino tiene hueco", async () => {
    const repo = teamSnapshot();
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const listDayAppointments = createListDayAppointments(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    const moved = await rescheduleAppointment({
      actor,
      appointmentId: created.id,
      professionalId: professionalB,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    assert.equal(moved.professionalId, professionalB);
    assert.equal(moved.id, created.id);

    const origin = await listDayAppointments({
      actor,
      professionalId: professionalA,
      localDate: "2026-08-25",
    });
    const destination = await listDayAppointments({
      actor,
      professionalId: professionalB,
      localDate: "2026-08-25",
    });
    assert.equal(origin.length, 0);
    assert.equal(destination.length, 1);
    assert.equal(destination[0]?.id, created.id);
  });

  it("rechaza un destino ocupado", async () => {
    const repo = teamSnapshot();
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await createAppointment({
      actor,
      professionalId: professionalB,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    await assert.rejects(
      () =>
        rescheduleAppointment({
          actor,
          appointmentId: created.id,
          professionalId: professionalB,
          localDate: "2026-08-25",
          localTime: "09:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SLOT_UNAVAILABLE",
    );
  });

  it("rechaza reprogramar a un destino que llena el local", async () => {
    const repo = teamRepo(1);
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });
    await createAppointment({
      actor,
      professionalId: professionalB,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "10:00",
      now: tuesdayMorning,
    });

    await assert.rejects(
      () =>
        rescheduleAppointment({
          actor,
          appointmentId: created.id,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "SLOT_UNAVAILABLE",
    );
  });

  it("rechaza un turno no movible", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:00",
          durationMinutes: 50,
          status: "COMPLETED",
          serviceName: "Corte de dama",
          serviceId: serviceA,
          clientId: clientA,
          clientFirstName: null,
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
      ],
    });
    const rescheduleAppointment = createRescheduleAppointment(repo);
    await assert.rejects(
      () =>
        rescheduleAppointment({
          actor,
          appointmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "10:30",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "NOT_MOVABLE",
    );
  });

  it("rechaza el mismo día, hora y profesional", async () => {
    const repo = createMemoryAvailabilityRepository({ snapshot: snapshot() });
    const createAppointment = createCreateAppointment(repo);
    const rescheduleAppointment = createRescheduleAppointment(repo);
    const created = await createAppointment({
      actor,
      professionalId: professionalA,
      serviceId: serviceA,
      clientId: clientA,
      localDate: "2026-08-25",
      localTime: "09:00",
      now: tuesdayMorning,
    });

    await assert.rejects(
      () =>
        rescheduleAppointment({
          actor,
          appointmentId: created.id,
          professionalId: professionalA,
          localDate: "2026-08-25",
          localTime: "09:00",
          now: tuesdayMorning,
        }),
      (error: unknown) => error instanceof BookingError && error.reason === "NO_CHANGE",
    );
  });
});

describe("listRescheduleProfessionals", () => {
  const appointmentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1";
  const fullDay = {
    startDate: "2026-08-25",
    endDate: "2026-08-25",
    startTime: null as string | null,
    endTime: null as string | null,
    owner: "branch" as const,
  };

  function teamRepo(options?: {
    branchBlocks?: AvailabilitySnapshot["blocks"];
    extraBlocksByProfessionalId?: Record<string, AvailabilitySnapshot["blocks"]>;
  }) {
    const base = snapshot({
      blocks: options?.branchBlocks ?? [],
    });
    const professional = base.professional;
    if (!professional) {
      throw new Error("fixture requires a professional");
    }
    return createMemoryAvailabilityRepository({
      snapshot: base,
      extraBlocksByProfessionalId: options?.extraBlocksByProfessionalId,
      professionals: [
        professional,
        {
          id: professionalB,
          displayName: "Beto",
          branchId: "branch",
          serviceIds: [serviceA],
          isActive: true,
        },
      ],
      dayAppointments: [
        {
          id: appointmentId,
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-18",
          localTime: "10:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte de dama",
          serviceId: serviceA,
          clientFirstName: "Lucía",
          clientLastName: null,
          clientPhone: "+5491112345678",
        },
      ],
    });
  }

  it("no lista a nadie si la sucursal está bloqueada el día completo", async () => {
    const listRescheduleProfessionals = createListRescheduleProfessionals(
      teamRepo({ branchBlocks: [fullDay] }),
    );
    const result = await listRescheduleProfessionals({
      actor,
      appointmentId,
      localDate: "2026-08-25",
      now: tuesdayMorning,
    });
    assert.deepEqual(result.professionals, []);
    assert.equal(result.emptyReason, "BRANCH_BLOCKED");
    assert.equal(result.branchName, "Sede principal");
  });

  it("lista a quien tiene hueco cuando no hay bloqueo", async () => {
    const listRescheduleProfessionals = createListRescheduleProfessionals(teamRepo());
    const result = await listRescheduleProfessionals({
      actor,
      appointmentId,
      localDate: "2026-08-25",
      now: tuesdayMorning,
    });
    assert.deepEqual(
      result.professionals.map((item) => item.id).sort(),
      [professionalA, professionalB].sort(),
    );
    assert.equal(result.emptyReason, null);
    assert.equal(result.branchName, null);
  });

  it("omite a quien está bloqueado y deja a las demás", async () => {
    const listRescheduleProfessionals = createListRescheduleProfessionals(
      teamRepo({ extraBlocksByProfessionalId: { [professionalB]: [fullDay] } }),
    );
    const result = await listRescheduleProfessionals({
      actor,
      appointmentId,
      localDate: "2026-08-25",
      now: tuesdayMorning,
    });
    assert.deepEqual(
      result.professionals.map((item) => item.id),
      [professionalA],
    );
    assert.equal(result.emptyReason, null);
  });
});
