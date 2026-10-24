import type { PrismaClient } from "@/generated/prisma/client";
import type {
  SubscriptionRecord,
  SubscriptionStore,
} from "@/modules/billing/application/ports/subscription-store";
import type { PlanCode, SubscriptionStatus } from "@/modules/billing/domain/subscription";

const recordSelect = {
  id: true,
  plan: true,
  providerSubscriptionId: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  graceEndsAt: true,
  periodEndsAt: true,
} as const;

function toRecord(row: {
  id: string;
  plan: PlanCode;
  providerSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  graceEndsAt: Date | null;
  periodEndsAt: Date | null;
}): SubscriptionRecord {
  return {
    tenantId: row.id,
    plan: row.plan,
    providerSubscriptionId: row.providerSubscriptionId,
    status: row.subscriptionStatus,
    trialEndsAt: row.trialEndsAt,
    graceEndsAt: row.graceEndsAt,
    periodEndsAt: row.periodEndsAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export function createPrismaSubscriptionStore(db: PrismaClient): SubscriptionStore {
  return {
    async findByProviderId(providerSubscriptionId) {
      const row = await db.tenant.findUnique({
        where: { providerSubscriptionId },
        select: recordSelect,
      });
      return row ? toRecord(row) : null;
    },
    async findByTenantId(tenantId) {
      const row = await db.tenant.findUnique({
        where: { id: tenantId },
        select: recordSelect,
      });
      return row ? toRecord(row) : null;
    },
    async listLinked() {
      const rows = await db.tenant.findMany({
        where: { providerSubscriptionId: { not: null }, isActive: true },
        select: recordSelect,
      });
      return rows.map(toRecord);
    },
    async save(record) {
      await db.tenant.update({
        where: { id: record.tenantId },
        data: {
          subscriptionStatus: record.status,
          trialEndsAt: record.trialEndsAt,
          graceEndsAt: record.graceEndsAt,
          periodEndsAt: record.periodEndsAt ?? null,
          providerSubscriptionId: record.providerSubscriptionId,
        },
      });
    },
    async claimEvent(eventId) {
      try {
        await db.processedProviderEvent.create({ data: { id: eventId } });
        return true;
      } catch (error) {
        if (isUniqueViolation(error)) {
          return false;
        }
        throw error;
      }
    },
  };
}
