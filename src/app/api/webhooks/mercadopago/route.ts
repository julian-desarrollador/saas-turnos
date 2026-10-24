import { NextResponse } from "next/server";

import {
  mercadoPagoSignatureMatches,
  parsePeriodReference,
} from "@/modules/billing/adapters/outbound/mercadopago-gateway";
import { createPrismaSubscriptionStore } from "@/modules/billing/adapters/outbound/prisma-subscription-store";
import { BillingError } from "@/modules/billing/application/errors";
import { createApplyPeriodPayment } from "@/modules/billing/application/use-cases/apply-period-payment";
import { createApplyProviderCharge } from "@/modules/billing/application/use-cases/apply-provider-charge";
import { serverEnv } from "@/lib/env/server";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const secret = serverEnv.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !serverEnv.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const payload = await request.text();
  let body: { data?: { id?: string | number }; type?: string };
  try {
    body = JSON.parse(payload) as { data?: { id?: string | number }; type?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataId = url.searchParams.get("data.id") ?? String(body.data?.id ?? "");
  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  if (!mercadoPagoSignatureMatches({ dataId, requestId, signature, secret })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
    headers: { Authorization: `Bearer ${serverEnv.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  if (!paymentResponse.ok) {
    return NextResponse.json({ error: "Payment lookup failed" }, { status: 502 });
  }
  const payment = (await paymentResponse.json()) as {
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
    currency_id?: string;
    metadata?: { preapproval_id?: string };
  };
  const externalReference = payment.external_reference ?? "";

  const period = parsePeriodReference(externalReference);
  if (period) {
    if (payment.status !== "approved" || payment.currency_id !== "ARS") {
      return NextResponse.json({ received: true });
    }
    try {
      await createApplyPeriodPayment(createPrismaSubscriptionStore(db))({
        eventId: `payment:${body.data.id}:period`,
        tenantId: period.tenantId,
        months: period.months,
        amountArs: payment.transaction_amount ?? 0,
        now: new Date(),
      });
    } catch (error) {
      if (!(error instanceof BillingError)) {
        throw error;
      }
      console.error("mercadopago period payment rejected", {
        paymentId: String(body.data.id),
        reason: error.reason,
      });
    }
    return NextResponse.json({ received: true });
  }

  const outcome =
    payment.status === "approved" ? "paid" : payment.status === "rejected" ? "failed" : null;
  if (!outcome) {
    return NextResponse.json({ received: true });
  }

  const tenantId = /^[0-9a-f-]{36}$/i.test(externalReference) ? externalReference : null;
  const providerSubscriptionId =
    payment.metadata?.preapproval_id ??
    (tenantId
      ? (
          await db.tenant.findUnique({
            where: { id: tenantId },
            select: { providerSubscriptionId: true },
          })
        )?.providerSubscriptionId
      : null);
  if (!providerSubscriptionId) {
    return NextResponse.json({ received: true });
  }

  await createApplyProviderCharge(createPrismaSubscriptionStore(db))({
    eventId: `payment:${body.data.id}:${outcome}`,
    providerSubscriptionId,
    outcome,
    now: new Date(),
  });
  return NextResponse.json({ received: true });
}
