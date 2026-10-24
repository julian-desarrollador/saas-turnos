import { applyCancellation } from "@/modules/billing/domain/subscription";

import { BillingError } from "../errors";
import type { PaymentGateway } from "../ports/payment-gateway";
import type { SubscriptionStore } from "../ports/subscription-store";

export function createCancelSubscription(store: SubscriptionStore, gateway: PaymentGateway) {
  return async function cancelSubscription(tenantId: string): Promise<void> {
    const record = await store.findByTenantId(tenantId);
    if (!record) {
      throw new BillingError("CONFLICT", "NOT_CONFIGURED");
    }
    if (record.status === "CANCELLED") {
      return;
    }
    if (record.providerSubscriptionId) {
      try {
        await gateway.cancelSubscription(record.providerSubscriptionId);
      } catch {
        throw new BillingError("EXTERNAL", "PAYMENT_FAILED");
      }
    }
    const next = applyCancellation(record);
    await store.save({ ...record, ...next });
  };
}
