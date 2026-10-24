import { assertPermission, type Role } from "@/core/authorization";
import { monthlyArs, remainingTrialDays } from "@/modules/billing/domain/subscription";

import { BillingError } from "../errors";
import type { PaymentGateway } from "../ports/payment-gateway";
import type { SubscriptionStore } from "../ports/subscription-store";

export function gatewayFailure(error: unknown): BillingError {
  if (error instanceof Error && error.message === "NOT_CONFIGURED") {
    return new BillingError("CONFLICT", "NOT_CONFIGURED");
  }
  return new BillingError("EXTERNAL", "PAYMENT_FAILED");
}

export function createStartSubscription(store: SubscriptionStore, gateway: PaymentGateway) {
  return async function startSubscription(input: {
    tenantId: string;
    role: Role;
    payerEmail: string;
    backUrl: string;
    now: Date;
  }): Promise<{ initPoint: string }> {
    assertPermission(input.role, "billing.manage");
    if (!input.payerEmail) {
      throw new BillingError("VALIDATION", "EMAIL_INVALID");
    }
    const record = await store.findByTenantId(input.tenantId);
    if (!record) {
      throw new BillingError("CONFLICT", "TENANT_NOT_FOUND");
    }
    if (record.status === "CANCELLED") {
      throw new BillingError("CONFLICT", "SUBSCRIPTION_CANCELLED");
    }
    if (record.providerSubscriptionId) {
      throw new BillingError("CONFLICT", "ALREADY_LINKED");
    }

    let created: { id: string; initPoint: string };
    try {
      created = await gateway.createSubscription({
        plan: record.plan,
        amountArs: monthlyArs(record.plan),
        freeTrialDays: remainingTrialDays(record, input.now),
        payerEmail: input.payerEmail,
        backUrl: input.backUrl,
        externalReference: record.tenantId,
      });
    } catch (error) {
      throw gatewayFailure(error);
    }
    await store.save({ ...record, providerSubscriptionId: created.id });
    return { initPoint: created.initPoint };
  };
}
