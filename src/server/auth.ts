import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isRole, type Role } from "@/core/authorization";
import { db } from "@/server/db";

const DEMO_TENANT_SLUG = "demo";

export type TenantContext = {
  tenant: { id: string; slug: string; name: string; timezone: string };
  membership: { id: string; role: Role };
  user: { id: string; externalId: string; firstName: string | null };
};

export async function loadPlatformHome(): Promise<{
  signedIn: boolean;
  canOpenDemo: boolean;
}> {
  const { userId } = await auth();
  if (!userId) {
    return { signedIn: false, canOpenDemo: false };
  }

  const membership = await db.membership.findFirst({
    where: {
      user: { externalId: userId },
      tenant: { slug: DEMO_TENANT_SLUG, isActive: true },
      isActive: true,
    },
    select: { role: true },
  });

  return {
    signedIn: true,
    canOpenDemo: Boolean(membership && isRole(membership.role)),
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

  return {
    tenant: {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      name: membership.tenant.name,
      timezone: membership.tenant.timezone,
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
