import {
  applyPeriodPayment as applyPeriod,
  isPeriodMonths,
  periodPrice,
} from "@/modules/billing/domain/subscription";

import { BillingError } from "../errors";
import type { SubscriptionStore } from "../ports/subscription-store";

export function createApplyPeriodPayment(store: SubscriptionStore) {
  return async function applyPeriodPayment(input: {
    eventId: string;
    tenantId: string;
    months: number;
    amountArs: number;
    now: Date;
  }): Promise<"applied" | "duplicate"> {
    if (!isPeriodMonths(input.months)) {
      throw new BillingError("VALIDATION", "PERIOD_INVALID");
    }
    const record = await store.findByTenantId(input.tenantId);
    if (!record) {
      throw new BillingError("CONFLICT", "TENANT_NOT_FOUND");
    }
    if (input.amountArs < periodPrice(record.plan, input.months)) {
      throw new BillingError("VALIDATION", "AMOUNT_TOO_LOW");
    }
    if (!(await store.claimEvent(input.eventId))) {
      return "duplicate";
    }
    await store.save({ ...record, ...applyPeriod(record, input.months, input.now) });
    return "applied";
  };
}
