import type { PeriodMonths, PlanCode } from "@/modules/billing/domain/subscription";

export type RemoteSubscription = {
  status: "active" | "pending" | "paused" | "cancelled";
  lastChargedAt: Date | null;
};

export type PaymentGateway = {
  createSubscription(input: {
    plan: PlanCode;
    amountArs: number;
    freeTrialDays: number;
    payerEmail: string;
    backUrl: string;
    externalReference: string;
  }): Promise<{ id: string; initPoint: string }>;
  createPeriodCheckout(input: {
    tenantId: string;
    plan: PlanCode;
    months: PeriodMonths;
    amountArs: number;
    payerEmail: string;
    backUrl: string;
  }): Promise<{ initPoint: string }>;
  getSubscription(providerSubscriptionId: string): Promise<RemoteSubscription>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
};
