import type { CommercialSnapshot, PlanCode } from "@/modules/billing/domain/subscription";

export type SubscriptionRecord = CommercialSnapshot & {
  tenantId: string;
  providerSubscriptionId: string | null;
  plan: PlanCode;
};

export type SubscriptionStore = {
  findByProviderId(providerSubscriptionId: string): Promise<SubscriptionRecord | null>;
  findByTenantId(tenantId: string): Promise<SubscriptionRecord | null>;
  listLinked(): Promise<SubscriptionRecord[]>;
  save(record: SubscriptionRecord): Promise<void>;
  claimEvent(eventId: string): Promise<boolean>;
};
