import { applyCharge, type ChargeOutcome } from "@/modules/billing/domain/subscription";

import type { SubscriptionStore } from "../ports/subscription-store";

export function createApplyProviderCharge(store: SubscriptionStore) {
  return async function applyProviderCharge(input: {
    eventId: string;
    providerSubscriptionId: string;
    outcome: ChargeOutcome;
    now: Date;
  }): Promise<void> {
    const claimed = await store.claimEvent(input.eventId);
    if (!claimed) {
      return;
    }
    const current = await store.findByProviderId(input.providerSubscriptionId);
    if (!current) {
      return;
    }
    await store.save({ ...current, ...applyCharge(current, input.outcome, input.now) });
  };
}
