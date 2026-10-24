import { NextResponse } from "next/server";

import { createMercadoPagoGateway } from "@/modules/billing/adapters/outbound/mercadopago-gateway";
import { createPrismaSubscriptionStore } from "@/modules/billing/adapters/outbound/prisma-subscription-store";
import { createReconcileSubscriptions } from "@/modules/billing/application/use-cases/reconcile-subscriptions";
import { serverEnv } from "@/lib/env/server";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret || !serverEnv.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await createReconcileSubscriptions(
    createPrismaSubscriptionStore(db),
    createMercadoPagoGateway(),
  )(new Date());
  return NextResponse.json({ ok: true });
}
