import "server-only";

import { commercialAccess, type CommercialAccess } from "@/modules/billing/domain/subscription";
import { db } from "@/server/db";

export type PublicTenant = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  access: CommercialAccess;
};

export async function findPublicTenant(slug: string): Promise<PublicTenant | null> {
  const tenant = await db.tenant.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      timezone: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      graceEndsAt: true,
      periodEndsAt: true,
    },
  });
  if (!tenant) {
    return null;
  }
  const commercial = commercialAccess(
    {
      status: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      graceEndsAt: tenant.graceEndsAt,
      periodEndsAt: tenant.periodEndsAt,
    },
    new Date(),
  );
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    timezone: tenant.timezone,
    access: commercial.access,
  };
}
