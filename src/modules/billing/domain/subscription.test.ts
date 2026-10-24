import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyCancellation,
  applyCharge,
  applyPeriodPayment,
  commercialAccess,
  employeeLimit,
  graceEndsAt,
  messageCap,
  monthlyArs,
  periodPrice,
  trialEndsAt,
} from "./subscription";

const start = new Date("2026-09-01T12:00:00.000Z");

describe("suscripción", () => {
  it("abre un mes de prueba y 7 días de gracia", () => {
    assert.equal(trialEndsAt(start).toISOString(), "2026-10-01T12:00:00.000Z");
    assert.equal(graceEndsAt(start).toISOString(), "2026-09-08T12:00:00.000Z");
  });

  it("da acceso completo durante la prueba y aviso con gracia si el cobro falla", () => {
    const trial = {
      status: "TRIAL" as const,
      trialEndsAt: trialEndsAt(start),
      graceEndsAt: null,
    };
    assert.equal(commercialAccess(trial, new Date("2026-09-10T12:00:00.000Z")).access, "full");

    const pastDue = applyCharge(trial, "failed", trial.trialEndsAt);
    assert.equal(pastDue.status, "PAST_DUE");
    assert.equal(commercialAccess(pastDue, new Date("2026-09-16T12:00:00.000Z")).access, "full");
    assert.equal(commercialAccess(pastDue, graceEndsAt(trial.trialEndsAt)).access, "today");
  });

  it("pasa a activa si el cobro entra al vencer la prueba y no corta la agenda de hoy al suspender", () => {
    const trial = {
      status: "TRIAL" as const,
      trialEndsAt: trialEndsAt(start),
      graceEndsAt: null,
    };
    const active = applyCharge(trial, "paid", trial.trialEndsAt);
    assert.equal(active.status, "ACTIVE");
    assert.equal(active.periodEndsAt?.toISOString(), "2026-11-01T12:00:00.000Z");
    assert.equal(commercialAccess(active, trial.trialEndsAt).access, "full");

    const suspended = {
      status: "SUSPENDED" as const,
      trialEndsAt: trial.trialEndsAt,
      graceEndsAt: graceEndsAt(trial.trialEndsAt),
    };
    assert.equal(commercialAccess(suspended, new Date("2026-10-01T12:00:00.000Z")).access, "today");
    assert.equal(commercialAccess(applyCancellation(active), start).access, "blocked");
  });

  it("no alarga la gracia en un reintento", () => {
    const pastDue = applyCharge(
      { status: "ACTIVE" as const, trialEndsAt: null, graceEndsAt: null },
      "failed",
      start,
    );
    const retried = applyCharge(pastDue, "failed", new Date("2026-09-03T12:00:00.000Z"));
    assert.equal(retried.graceEndsAt?.toISOString(), pastDue.graceEndsAt?.toISOString());
  });

  it("cobra en pesos, limita el equipo del plan y el año sale como diez meses", () => {
    assert.equal(monthlyArs("INICIO"), 17900);
    assert.equal(monthlyArs("NEGOCIO"), 29900);
    assert.equal(monthlyArs("EQUIPO"), 47900);
    assert.equal(employeeLimit("INICIO"), 2);
    assert.equal(employeeLimit("NEGOCIO"), 4);
    assert.equal(employeeLimit("EQUIPO"), 8);
    assert.equal(messageCap("INICIO"), 80);
    assert.equal(messageCap("NEGOCIO"), 180);
    assert.equal(messageCap("EQUIPO"), 400);
    assert.equal(periodPrice("INICIO", 1), 17900);
    assert.equal(periodPrice("INICIO", 12), 179000);
    assert.equal(periodPrice("EQUIPO", 12), 479000);
  });

  it("vence el período pago y da 7 días de gracia desde el vencimiento", () => {
    const active = {
      status: "ACTIVE" as const,
      trialEndsAt: null,
      graceEndsAt: null,
      periodEndsAt: new Date("2026-10-01T12:00:00.000Z"),
    };
    assert.deepEqual(commercialAccess(active, new Date("2026-09-30T12:00:00.000Z")), {
      status: "ACTIVE",
      access: "full",
    });
    assert.deepEqual(commercialAccess(active, new Date("2026-10-02T12:00:00.000Z")), {
      status: "PAST_DUE",
      access: "full",
    });
    assert.deepEqual(commercialAccess(active, new Date("2026-10-08T12:00:00.000Z")), {
      status: "SUSPENDED",
      access: "today",
    });
  });

  it("un pago del mes extiende desde el vencimiento si se paga antes, y desde hoy si ya venció", () => {
    const early = applyPeriodPayment(
      {
        status: "ACTIVE",
        trialEndsAt: null,
        graceEndsAt: null,
        periodEndsAt: new Date("2026-10-01T12:00:00.000Z"),
      },
      1,
      new Date("2026-09-25T12:00:00.000Z"),
    );
    assert.equal(early.status, "ACTIVE");
    assert.equal(early.periodEndsAt?.toISOString(), "2026-11-01T12:00:00.000Z");

    const late = applyPeriodPayment(
      {
        status: "SUSPENDED",
        trialEndsAt: null,
        graceEndsAt: new Date("2026-10-08T12:00:00.000Z"),
        periodEndsAt: new Date("2026-10-01T12:00:00.000Z"),
      },
      1,
      new Date("2026-10-10T12:00:00.000Z"),
    );
    assert.equal(late.status, "ACTIVE");
    assert.equal(late.graceEndsAt, null);
    assert.equal(late.periodEndsAt?.toISOString(), "2026-11-10T12:00:00.000Z");
  });

  it("pagar el año en la prueba no pierde los días que quedan, y no revive una baja", () => {
    const trial = {
      status: "TRIAL" as const,
      trialEndsAt: trialEndsAt(start),
      graceEndsAt: null,
    };
    const yearly = applyPeriodPayment(trial, 12, start);
    assert.equal(yearly.periodEndsAt?.toISOString(), "2027-10-01T12:00:00.000Z");

    const cancelled = applyCancellation(trial);
    assert.deepEqual(applyPeriodPayment(cancelled, 1, start), cancelled);
  });
});
