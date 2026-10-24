import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isRole, type Role } from "@/core/authorization";
import {
  commercialAccess,
  type CommercialAccess,
  type SubscriptionStatus,
} from "@/modules/billing/domain/subscription";
import { db } from "@/server/db";

export type TenantContext = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    access: CommercialAccess;
    subscriptionStatus: SubscriptionStatus;
    hasPaymentMethod: boolean;
  };
  membership: { id: string; role: Role };
  user: { id: string; externalId: string; firstName: string | null };
};

export async function loadPlatformHome(): Promise<{
  signedIn: boolean;
  businesses: { slug: string; name: string }[];
}> {
  const { userId } = await auth();
  if (!userId) {
    return { signedIn: false, businesses: [] };
  }

  const memberships = await db.membership.findMany({
    where: {
      user: { externalId: userId },
      tenant: { isActive: true },
      isActive: true,
    },
    include: { tenant: { select: { slug: true, name: true } } },
    orderBy: { tenant: { name: "asc" } },
  });

  return {
    signedIn: true,
    businesses: memberships
      .filter((membership) => isRole(membership.role))
      .map((membership) => ({
        slug: membership.tenant.slug,
        name: membership.tenant.name,
      })),
  };
}

export const resolveTenantContext = cache(async (slug: string): Promise<TenantContext> => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn();
    redirect("/sign-in" as never);
  }

  const membership = await db.membership.findFirst({
    where: {
      user: { externalId: userId },
      tenant: { slug, isActive: true },
      isActive: true,
    },
    include: {
      tenant: true,
      user: true,
    },
  });

  if (!membership || !isRole(membership.role)) {
    redirect("/" as never);
  }

  const commercial = commercialAccess(
    {
      status: membership.tenant.subscriptionStatus,
      trialEndsAt: membership.tenant.trialEndsAt,
      graceEndsAt: membership.tenant.graceEndsAt,
      periodEndsAt: membership.tenant.periodEndsAt,
    },
    new Date(),
  );

  return {
    tenant: {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      name: membership.tenant.name,
      timezone: membership.tenant.timezone,
      access: commercial.access,
      subscriptionStatus: commercial.status,
      hasPaymentMethod: Boolean(membership.tenant.providerSubscriptionId),
    },
    membership: {
      id: membership.id,
      role: membership.role,
    },
    user: {
      id: membership.user.id,
      externalId: membership.user.externalId,
      firstName: membership.user.firstName,
    },
  };
});
