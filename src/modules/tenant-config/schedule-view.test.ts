import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  branchScheduleCards,
  capacityQuestion,
  professionalScheduleCards,
  scheduleOwnerHref,
  scheduleToastMessage,
  weekSummary,
} from "@/modules/tenant-config/components/schedule-view";

describe("schedule view", () => {
  it("sin franjas dice que no hay horario", () => {
    assert.equal(weekSummary([]), "Sin horario cargado");
  });

  it("resume una semana corrida con la misma hora", () => {
    const slots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
    }));
    assert.equal(weekSummary(slots), "Lun a Vie · 09:00–18:00");
  });

  it("lista los días salteados cuando la hora es la misma", () => {
    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
    ];
    assert.equal(weekSummary(slots), "Lun, Mié, Vie · 09:00–13:00");
  });

  it("si las horas cambian, solo nombra los días", () => {
    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "14:00" },
    ];
    assert.equal(weekSummary(slots), "Lun, Sáb");
  });

  it("une dos franjas del mismo día", () => {
    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 1, startTime: "16:00", endTime: "20:00" },
    ];
    assert.equal(weekSummary(slots), "Lun · 09:00–13:00 y 16:00–20:00");
  });

  it("ordena profesionales activos primero y por nombre", () => {
    const cards = professionalScheduleCards(
      [
        { id: "p2", displayName: "Zoe", isActive: true },
        { id: "p3", displayName: "Bruno", isActive: false },
        { id: "p1", displayName: "Ana", isActive: true },
      ],
      [
        {
          professionalId: "p2",
          branchId: null,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "18:00",
        },
      ],
    );

    assert.deepEqual(
      cards.map((card) => card.displayName),
      ["Ana", "Zoe", "Bruno"],
    );
    assert.equal(cards[0]?.hasSchedule, false);
    assert.equal(cards[1]?.hasSchedule, true);
  });

  it("arma las cards del local con su propia semana", () => {
    const cards = branchScheduleCards(
      [{ id: "b1", name: "Centro" }],
      [
        {
          branchId: "b1",
          professionalId: null,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "18:00",
        },
      ],
    );

    assert.equal(cards[0]?.weekLabel, "Lun · 09:00–18:00");
    assert.equal(scheduleOwnerHref("demo", "branch", "b1"), "/demo/schedule/sucursal/b1");
    assert.equal(scheduleOwnerHref("demo", "professional", "p1"), "/demo/schedule/profesional/p1");
  });

  it("confirma el guardado con el nombre y pregunta la capacidad en claro", () => {
    assert.equal(scheduleToastMessage("Ana"), "Horario guardado · Ana");
    assert.equal(scheduleToastMessage("  "), "Horario guardado");
    assert.equal(capacityQuestion("branch"), "¿Cuántos turnos caben a la vez en el local?");
    assert.equal(capacityQuestion("professional"), "¿Cuántos turnos atiende a la vez?");
  });
});
