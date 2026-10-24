import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createCancelSubscription } from "@/modules/billing/application/use-cases/cancel-subscription";
import type { PaymentGateway } from "@/modules/billing/application/ports/payment-gateway";
import type {
  SubscriptionRecord,
  SubscriptionStore,
} from "@/modules/billing/application/ports/subscription-store";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function memoryStore(seed: SubscriptionRecord[]): SubscriptionStore {
  const rows = seed.map((row) => ({ ...row }));
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
        rows[index] = record;
      }
    },
    async claimEvent() {
      return true;
    },
  };
}

function gateway(cancelled: string[]): PaymentGateway {
  return {
    async createSubscription() {
      return { id: "pre_new", initPoint: "https://mp.test/checkout" };
    },
    async createPeriodCheckout() {
      return { initPoint: "https://mp.test/pay" };
    },
    async getSubscription() {
      return { status: "active", lastChargedAt: null };
    },
    async cancelSubscription(providerSubscriptionId) {
      cancelled.push(providerSubscriptionId);
    },
  };
}

describe("baja de la suscripción", () => {
  it("cancela en Mercado Pago y no toca el otro negocio", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: "pre_a",
        status: "TRIAL",
        trialEndsAt: new Date("2026-09-15T12:00:00.000Z"),
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
    const cancelled: string[] = [];
    const cancel = createCancelSubscription(store, gateway(cancelled));
    await cancel(tenantA);
    assert.equal((await store.findByTenantId(tenantA))?.status, "CANCELLED");
    assert.equal((await store.findByTenantId(tenantB))?.status, "ACTIVE");
    assert.deepEqual(cancelled, ["pre_a"]);
  });

  it("sin medio de pago cancela igual y no llama al proveedor", async () => {
    const store = memoryStore([
      {
        tenantId: tenantA,
        plan: "INICIO",
        providerSubscriptionId: null,
        status: "TRIAL",
        trialEndsAt: new Date("2026-09-15T12:00:00.000Z"),
        graceEndsAt: null,
      },
    ]);
    const cancelled: string[] = [];
    const cancel = createCancelSubscription(store, gateway(cancelled));
    await cancel(tenantA);
    assert.equal((await store.findByTenantId(tenantA))?.status, "CANCELLED");
    assert.deepEqual(cancelled, []);
  });
});
