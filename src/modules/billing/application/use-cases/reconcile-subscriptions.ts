import { createApplyProviderCharge } from "@/modules/billing/application/use-cases/apply-provider-charge";

import type { PaymentGateway } from "../ports/payment-gateway";
import type { SubscriptionStore } from "../ports/subscription-store";

export function createReconcileSubscriptions(store: SubscriptionStore, gateway: PaymentGateway) {
  return async function reconcileSubscriptions(now: Date): Promise<void> {
    const apply = createApplyProviderCharge(store);
    const linked = await store.listLinked();
    for (const record of linked) {
      const providerSubscriptionId = record.providerSubscriptionId;
      if (!providerSubscriptionId) {
        continue;
      }
      const remote = await gateway.getSubscription(providerSubscriptionId);
      if (remote.lastChargedAt) {
        await apply({
          eventId: `reconcile:${providerSubscriptionId}:charge:${remote.lastChargedAt.toISOString()}`,
          providerSubscriptionId,
          outcome: "paid",
          now: remote.lastChargedAt,
        });
      }
      if (remote.status === "paused" || remote.status === "cancelled") {
        await apply({
          eventId: `reconcile:${providerSubscriptionId}:status:${remote.status}`,
          providerSubscriptionId,
          outcome: "failed",
          now,
        });
      }
      if (remote.status === "cancelled") {
        const current = await store.findByProviderId(providerSubscriptionId);
        if (current) {
          await store.save({ ...current, providerSubscriptionId: null });
        }
      }
    }
  };
}
