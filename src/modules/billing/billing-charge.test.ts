import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApplyProviderCharge } from "@/modules/billing/application/use-cases/apply-provider-charge";
import { createReconcileSubscriptions } from "@/modules/billing/application/use-cases/reconcile-subscriptions";
import type {
  SubscriptionRecord,
  SubscriptionStore,
} from "@/modules/billing/application/ports/subscription-store";
import type {
  PaymentGateway,
  RemoteSubscription,
} from "@/modules/billing/application/ports/payment-gateway";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const day15 = new Date("2026-09-15T12:00:00.000Z");

function memoryStore(seed: SubscriptionRecord[]): SubscriptionStore {
  const rows = seed.map((row) => ({ ...row }));
  const events = new Set<string>();
  return {
    async findByProviderId(providerSubscriptionId) {
      return rows.find((row) => row.providerSubscriptionId === providerSubscriptionId) ?? null;
    },
    async findByTenantId(tenantId) {
      return rows.find((row) => row.tenantId === tenantId) ?? null;
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

function gatewayWith(remote: Record<string, RemoteSubscription>): PaymentGateway {
  return {
    async createSubscription() {
      return { id: "pre_new", initPoint: "https://mp.test/checkout" };
    },
    async createPeriodCheckout() {
      return { initPoint: "https://mp.test/pay" };
    },
    async getSubscription(id) {
      return remote[id] ?? { status: "active", lastChargedAt: null };
    },
    async cancelSubscription() {
      return undefined;
    },
  };
}

describe("cobro del día 15", () => {
  it("un cobro acreditado deja activa la suscripción y no la toca dos veces", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: "pre_a",
        status: "TRIAL",
        trialEndsAt: day15,
        graceEndsAt: null,
      },
    ]);
    const apply = createApplyProviderCharge(store);
    await apply({ eventId: "evt-1", providerSubscriptionId: "pre_a", outcome: "paid", now: day15 });
    await apply({
      eventId: "evt-1",
      providerSubscriptionId: "pre_a",
      outcome: "failed",
      now: day15,
    });
    const saved = await store.findByProviderId("pre_a");
    assert.equal(saved?.status, "ACTIVE");
    assert.equal(saved?.graceEndsAt, null);
    assert.equal(saved?.periodEndsAt?.toISOString(), "2026-10-15T12:00:00.000Z");
  });

  it("si Mercado Pago da de baja la suscripción queda con pago pendiente y no cambia el otro negocio", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: "pre_a",
        status: "TRIAL",
        trialEndsAt: day15,
        graceEndsAt: null,
      },
      {
        tenantId: tenantB,
        plan: "NEGOCIO",
        providerSubscriptionId: "pre_b",
        status: "ACTIVE",
        trialEndsAt: null,
        graceEndsAt: null,
      },
    ]);
    const reconcile = createReconcileSubscriptions(
      store,
      gatewayWith({ pre_a: { status: "cancelled", lastChargedAt: null } }),
    );
    await reconcile(day15);
    const a = await store.findByTenantId(tenantA);
    assert.equal(a?.status, "PAST_DUE");
    assert.equal(a?.providerSubscriptionId, null);
    const b = await store.findByTenantId(tenantB);
    assert.equal(b?.status, "ACTIVE");
    assert.equal(b?.providerSubscriptionId, "pre_b");
  });

  it("un cobro viejo no se vuelve a aplicar en cada conciliación", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: "pre_a",
        status: "TRIAL",
        trialEndsAt: day15,
        graceEndsAt: null,
      },
    ]);
    const reconcile = createReconcileSubscriptions(
      store,
      gatewayWith({ pre_a: { status: "active", lastChargedAt: day15 } }),
    );
    await reconcile(new Date("2026-09-16T08:00:00.000Z"));
    const paid = await store.findByTenantId(tenantA);
    assert.equal(paid?.status, "ACTIVE");
    assert.equal(paid?.periodEndsAt?.toISOString(), "2026-10-15T12:00:00.000Z");

    const failedOctober = createApplyProviderCharge(store);
    await failedOctober({
      eventId: "evt-oct",
      providerSubscriptionId: "pre_a",
      outcome: "failed",
      now: new Date("2026-10-16T12:00:00.000Z"),
    });
    await reconcile(new Date("2026-10-17T08:00:00.000Z"));
    assert.equal((await store.findByTenantId(tenantA))?.status, "PAST_DUE");
  });

  it("un débito fallido no baja un período que ya está pago", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: "pre_a",
        status: "ACTIVE",
        trialEndsAt: null,
        graceEndsAt: null,
        periodEndsAt: new Date("2027-09-01T12:00:00.000Z"),
      },
    ]);
    await createApplyProviderCharge(store)({
      eventId: "evt-fail",
      providerSubscriptionId: "pre_a",
      outcome: "failed",
      now: day15,
    });
    assert.equal((await store.findByTenantId(tenantA))?.status, "ACTIVE");
  });
});
