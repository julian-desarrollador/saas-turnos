"use server";

import { panelPath } from "@/core/panel-routes";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { hasPermission } from "@/core/authorization";
import { clientEnv } from "@/lib/env/client";
import { createMercadoPagoGateway } from "@/modules/billing/adapters/outbound/mercadopago-gateway";
import { createPrismaSubscriptionStore } from "@/modules/billing/adapters/outbound/prisma-subscription-store";
import { createCancelSubscription } from "@/modules/billing/application/use-cases/cancel-subscription";
import { createStartPeriodPayment } from "@/modules/billing/application/use-cases/start-period-payment";
import { createStartSubscription } from "@/modules/billing/application/use-cases/start-subscription";
import { resolveTenantContext } from "@/server/auth";

import { createClerkOrganizationDirectory } from "@/modules/billing/adapters/outbound/clerk-organization-directory";
import { createPrismaBusinessProvisioner } from "@/modules/billing/adapters/outbound/prisma-business-provisioner";
import { BillingError } from "@/modules/billing/application/errors";
import { createOpenTrial } from "@/modules/billing/application/use-cases/open-trial";
import { db, tenantDb } from "@/server/db";

import { billingMessage } from "./messages";

export type ActionState = {
  ok: boolean;
  message?: string;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function openTrialAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as never);
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  try {
    const openTrial = createOpenTrial(
      createPrismaBusinessProvisioner(db, tenantDb),
      createClerkOrganizationDirectory(),
    );
    const opened = await openTrial({
      ownerExternalId: userId,
      ownerEmail: email,
      ownerFirstName: user?.firstName ?? null,
      name: readString(formData, "name"),
      slug: readString(formData, "slug"),
      timezone: "America/Argentina/Buenos_Aires",
      plan: readString(formData, "plan"),
      phone: readString(formData, "phone"),
      now: new Date(),
    });
    redirect(`${panelPath(opened.slug, "primeros-pasos")}` as never);
  } catch (error) {
    if (error instanceof BillingError) {
      return { ok: false, message: billingMessage(error.reason) };
    }
    throw error;
  }
}

export async function startPaymentAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const method = readString(formData, "method");
  const ctx = await resolveTenantContext(slug);
  if (!hasPermission(ctx.membership.role, "billing.manage")) {
    return { ok: false, message: "Solo el dueño puede pagar la suscripción." };
  }
  const user = await currentUser();
  const input = {
    tenantId: ctx.tenant.id,
    role: ctx.membership.role,
    payerEmail: user?.emailAddresses[0]?.emailAddress ?? "",
    backUrl: `${clientEnv.NEXT_PUBLIC_APP_URL}${panelPath(slug, "agenda")}`,
  };

  let initPoint: string;
  try {
    const store = createPrismaSubscriptionStore(db);
    const gateway = createMercadoPagoGateway();
    if (method === "debit") {
      ({ initPoint } = await createStartSubscription(
        store,
        gateway,
      )({ ...input, now: new Date() }));
    } else {
      const months = method === "year" ? 12 : method === "month" ? 1 : 0;
      ({ initPoint } = await createStartPeriodPayment(store, gateway)({ ...input, months }));
    }
  } catch (error) {
    if (error instanceof BillingError) {
      return { ok: false, message: billingMessage(error.reason) };
    }
    throw error;
  }
  redirect(initPoint as never);
}

export async function cancelSubscriptionAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const ctx = await resolveTenantContext(slug);
  if (!hasPermission(ctx.membership.role, "billing.manage")) {
    return { ok: false, message: "Solo el dueño puede dar de baja la suscripción." };
  }
  if (formData.get("confirm") !== "on") {
    return { ok: false, message: "Confirmá la baja para continuar." };
  }
  try {
    const cancel = createCancelSubscription(
      createPrismaSubscriptionStore(db),
      createMercadoPagoGateway(),
    );
    await cancel(ctx.tenant.id);
  } catch (error) {
    if (error instanceof BillingError) {
      return { ok: false, message: billingMessage(error.reason) };
    }
    throw error;
  }
  redirect(`${panelPath(slug, "agenda")}` as never);
}
