import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { BillingError } from "@/modules/billing/application/errors";
import type { PaymentGateway } from "@/modules/billing/application/ports/payment-gateway";
import type {
  SubscriptionRecord,
  SubscriptionStore,
} from "@/modules/billing/application/ports/subscription-store";
import { createApplyPeriodPayment } from "@/modules/billing/application/use-cases/apply-period-payment";
import { createStartPeriodPayment } from "@/modules/billing/application/use-cases/start-period-payment";
import { createStartSubscription } from "@/modules/billing/application/use-cases/start-subscription";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const now = new Date("2026-10-16T12:00:00.000Z");

function seed(): SubscriptionRecord[] {
  return [
    {
      tenantId: tenantA,
      plan: "INICIO",
      providerSubscriptionId: null,
      status: "PAST_DUE",
      trialEndsAt: new Date("2026-10-10T12:00:00.000Z"),
      graceEndsAt: new Date("2026-10-17T12:00:00.000Z"),
    },
    {
      tenantId: tenantB,
      plan: "EQUIPO",
      providerSubscriptionId: null,
      status: "PAST_DUE",
      trialEndsAt: new Date("2026-10-10T12:00:00.000Z"),
      graceEndsAt: new Date("2026-10-17T12:00:00.000Z"),
    },
  ];
}

function memoryStore(rowsSeed: SubscriptionRecord[]): SubscriptionStore {
  const rows = rowsSeed.map((row) => ({ ...row }));
  const events = new Set<string>();
  return {
    async findByProviderId(providerSubscriptionId) {
      return rows.find((row) => row.providerSubscriptionId === providerSubscriptionId) ?? null;
    },
    async findByTenantId(tenantId) {
      const row = rows.find((candidate) => candidate.tenantId === tenantId);
      return row ? { ...row } : null;
    },
    async listLinked() {
      return rows.filter((row) => row.providerSubscriptionId);
    },
    async save(record) {
      const index = rows.findIndex((row) => row.tenantId === record.tenantId);
      if (index >= 0) {
        rows[index] = { ...record };
      }
    },
    async claimEvent(eventId) {
      if (events.has(eventId)) {
        return false;
      }
      events.add(eventId);
      return true;
    },
  };
}

type Calls = {
  subscriptions: { amountArs: number; freeTrialDays: number }[];
  checkouts: { amountArs: number; months: number }[];
};

function recordingGateway(calls: Calls): PaymentGateway {
  return {
    async createSubscription(input) {
      calls.subscriptions.push({ amountArs: input.amountArs, freeTrialDays: input.freeTrialDays });
      return { id: `pre_${input.externalReference}`, initPoint: "https://mp.test/subscribe" };
    },
    async createPeriodCheckout(input) {
      calls.checkouts.push({ amountArs: input.amountArs, months: input.months });
      return { initPoint: "https://mp.test/pay" };
    },
    async getSubscription() {
      return { status: "active", lastChargedAt: null };
    },
    async cancelSubscription() {
      return undefined;
    },
  };
}

function emptyCalls(): Calls {
  return { subscriptions: [], checkouts: [] };
}

describe("pago del período", () => {
  it("acredita el mes pagado al negocio A y no toca al B", async () => {
    const store = memoryStore(seed());
    await createApplyPeriodPayment(store)({
      eventId: "payment:1",
      tenantId: tenantA,
      months: 1,
      amountArs: 17900,
      now,
    });
    const a = await store.findByTenantId(tenantA);
    assert.equal(a?.status, "ACTIVE");
    assert.equal(a?.periodEndsAt?.toISOString(), "2026-11-16T12:00:00.000Z");
    assert.equal((await store.findByTenantId(tenantB))?.status, "PAST_DUE");
  });

  it("el mismo pago dos veces se acredita una sola vez", async () => {
    const store = memoryStore(seed());
    const apply = createApplyPeriodPayment(store);
    const payment = { eventId: "payment:2", tenantId: tenantA, months: 1, amountArs: 17900, now };
    await apply(payment);
    await apply(payment);
    assert.equal(
      (await store.findByTenantId(tenantA))?.periodEndsAt?.toISOString(),
      "2026-11-16T12:00:00.000Z",
    );
  });

  it("un monto menor al precio del período no acredita", async () => {
    const store = memoryStore(seed());
    await assert.rejects(
      createApplyPeriodPayment(store)({
        eventId: "payment:3",
        tenantId: tenantB,
        months: 12,
        amountArs: 47900,
        now,
      }),
      (error: unknown) => error instanceof BillingError && error.reason === "AMOUNT_TOO_LOW",
    );
    assert.equal((await store.findByTenantId(tenantB))?.status, "PAST_DUE");
  });

  it("doce meses extienden un año", async () => {
    const store = memoryStore(seed());
    await createApplyPeriodPayment(store)({
      eventId: "manual:transferencia-1",
      tenantId: tenantB,
      months: 12,
      amountArs: 479000,
      now,
    });
    assert.equal(
      (await store.findByTenantId(tenantB))?.periodEndsAt?.toISOString(),
      "2027-10-16T12:00:00.000Z",
    );
  });
});

describe("inicio del pago", () => {
  it("solo el dueño inicia el pago y el monto sale del plan guardado", async () => {
    const calls = emptyCalls();
    const start = createStartPeriodPayment(memoryStore(seed()), recordingGateway(calls));
    await assert.rejects(
      start({
        tenantId: tenantA,
        role: "ADMIN",
        months: 1,
        payerEmail: "admin@test.com",
        backUrl: "https://app.test",
      }),
      ForbiddenError,
    );
    assert.deepEqual(calls.checkouts, []);

    const created = await start({
      tenantId: tenantA,
      role: "OWNER",
      months: 12,
      payerEmail: "owner@test.com",
      backUrl: "https://app.test",
    });
    assert.equal(created.initPoint, "https://mp.test/pay");
    assert.deepEqual(calls.checkouts, [{ amountArs: 179000, months: 12 }]);
  });

  it("no inicia el pago de una cuenta cancelada ni de un período inválido", async () => {
    const rows = seed();
    rows[0] = { ...rows[0]!, status: "CANCELLED" };
    const calls = emptyCalls();
    const start = createStartPeriodPayment(memoryStore(rows), recordingGateway(calls));
    const base = {
      role: "OWNER" as const,
      payerEmail: "owner@test.com",
      backUrl: "https://app.test",
    };
    await assert.rejects(
      start({ ...base, tenantId: tenantA, months: 1 }),
      (error: unknown) =>
        error instanceof BillingError && error.reason === "SUBSCRIPTION_CANCELLED",
    );
    await assert.rejects(
      start({ ...base, tenantId: tenantB, months: 6 }),
      (error: unknown) => error instanceof BillingError && error.reason === "PERIOD_INVALID",
    );
    assert.deepEqual(calls.checkouts, []);
  });

  it("asocia el débito en pesos una sola vez, solo el dueño, sin tocar el otro negocio", async () => {
    const calls = emptyCalls();
    const store = memoryStore(seed());
    const start = createStartSubscription(store, recordingGateway(calls));
    const input = { payerEmail: "owner@test.com", backUrl: "https://app.test", now };

    await assert.rejects(start({ ...input, tenantId: tenantA, role: "RECEPTION" }), ForbiddenError);
    await start({ ...input, tenantId: tenantA, role: "OWNER" });
    await assert.rejects(
      start({ ...input, tenantId: tenantA, role: "OWNER" }),
      (error: unknown) => error instanceof BillingError && error.reason === "ALREADY_LINKED",
    );

    assert.deepEqual(calls.subscriptions, [{ amountArs: 17900, freeTrialDays: 0 }]);
    assert.equal((await store.findByTenantId(tenantA))?.providerSubscriptionId, `pre_${tenantA}`);
    assert.equal((await store.findByTenantId(tenantB))?.providerSubscriptionId, null);
  });

  it("el débito asociado en prueba solo regala los días que le quedan", async () => {
    const rows = seed();
    rows[0] = {
      ...rows[0]!,
      status: "TRIAL",
      trialEndsAt: new Date("2026-10-20T09:00:00.000Z"),
      graceEndsAt: null,
    };
    const calls = emptyCalls();
    await createStartSubscription(
      memoryStore(rows),
      recordingGateway(calls),
    )({
      tenantId: tenantA,
      role: "OWNER",
      payerEmail: "owner@test.com",
      backUrl: "https://app.test",
      now,
    });
    assert.deepEqual(calls.subscriptions, [{ amountArs: 17900, freeTrialDays: 4 }]);
  });
});
