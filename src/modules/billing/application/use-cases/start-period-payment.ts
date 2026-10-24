import { assertPermission, type Role } from "@/core/authorization";
import { isPeriodMonths, periodPrice } from "@/modules/billing/domain/subscription";

import { BillingError } from "../errors";
import type { PaymentGateway } from "../ports/payment-gateway";
import type { SubscriptionStore } from "../ports/subscription-store";
import { gatewayFailure } from "./start-subscription";

export function createStartPeriodPayment(store: SubscriptionStore, gateway: PaymentGateway) {
  return async function startPeriodPayment(input: {
    tenantId: string;
    role: Role;
    months: number;
    payerEmail: string;
    backUrl: string;
  }): Promise<{ initPoint: string }> {
    assertPermission(input.role, "billing.manage");
    if (!isPeriodMonths(input.months)) {
      throw new BillingError("VALIDATION", "PERIOD_INVALID");
    }
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

    try {
      return await gateway.createPeriodCheckout({
        tenantId: record.tenantId,
        plan: record.plan,
        months: input.months,
        amountArs: periodPrice(record.plan, input.months),
        payerEmail: input.payerEmail,
        backUrl: input.backUrl,
      });
    } catch (error) {
      throw gatewayFailure(error);
    }
  };
}
