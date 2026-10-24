import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env/server";
import type {
  PaymentGateway,
  RemoteSubscription,
} from "@/modules/billing/application/ports/payment-gateway";
import type { PeriodMonths } from "@/modules/billing/domain/subscription";

const API = "https://api.mercadopago.com";
const PERIOD_PREFIX = "period:";

export function periodReference(tenantId: string, months: PeriodMonths): string {
  return `${PERIOD_PREFIX}${tenantId}:${months}`;
}

export function parsePeriodReference(
  reference: string,
): { tenantId: string; months: number } | null {
  const match = /^period:([0-9a-f-]{36}):(\d+)$/i.exec(reference);
  return match ? { tenantId: match[1]!, months: Number(match[2]) } : null;
}

function remoteStatus(status: string | undefined): RemoteSubscription["status"] {
  if (status === "authorized") {
    return "active";
  }
  if (status === "paused" || status === "cancelled") {
    return status;
  }
  return "pending";
}

function headers(): HeadersInit {
  const token = serverEnv.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("NOT_CONFIGURED");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function createMercadoPagoGateway(): PaymentGateway {
  return {
    async createSubscription(input) {
      const response = await fetch(`${API}/preapproval`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          reason: `Plan ${input.plan}`,
          external_reference: input.externalReference,
          payer_email: input.payerEmail,
          back_url: input.backUrl,
          status: "pending",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: input.amountArs,
            currency_id: "ARS",
            ...(input.freeTrialDays > 0
              ? { free_trial: { frequency: input.freeTrialDays, frequency_type: "days" } }
              : {}),
          },
        }),
      });
      if (!response.ok) {
        throw new Error("MERCADOPAGO_FAILED");
      }
      const body = (await response.json()) as { id?: string; init_point?: string };
      if (!body.id || !body.init_point) {
        throw new Error("MERCADOPAGO_FAILED");
      }
      return { id: body.id, initPoint: body.init_point };
    },
    async createPeriodCheckout(input) {
      const title =
        input.months === 12
          ? `Plan ${input.plan} · 12 meses (pagás 10)`
          : `Plan ${input.plan} · 1 mes`;
      const response = await fetch(`${API}/checkout/preferences`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          items: [{ title, quantity: 1, unit_price: input.amountArs, currency_id: "ARS" }],
          payer: { email: input.payerEmail },
          external_reference: periodReference(input.tenantId, input.months),
          back_urls: { success: input.backUrl, pending: input.backUrl, failure: input.backUrl },
          auto_return: "approved",
          notification_url: new URL("/api/webhooks/mercadopago", input.backUrl).toString(),
        }),
      });
      if (!response.ok) {
        throw new Error("MERCADOPAGO_FAILED");
      }
      const body = (await response.json()) as { init_point?: string };
      if (!body.init_point) {
        throw new Error("MERCADOPAGO_FAILED");
      }
      return { initPoint: body.init_point };
    },
    async getSubscription(providerSubscriptionId) {
      const response = await fetch(`${API}/preapproval/${providerSubscriptionId}`, {
        headers: headers(),
      });
      if (!response.ok) {
        throw new Error("MERCADOPAGO_FAILED");
      }
      const body = (await response.json()) as {
        status?: string;
        summarized?: { last_charged_date?: string | null };
      };
      const lastCharged = new Date(body.summarized?.last_charged_date ?? "");
      return {
        status: remoteStatus(body.status),
        lastChargedAt: Number.isNaN(lastCharged.getTime()) ? null : lastCharged,
      };
    },
    async cancelSubscription(providerSubscriptionId) {
      const response = await fetch(`${API}/preapproval/${providerSubscriptionId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!response.ok) {
        throw new Error("MERCADOPAGO_FAILED");
      }
    },
  };
}

export function mercadoPagoSignatureMatches(input: {
  dataId: string;
  requestId: string;
  signature: string;
  secret: string;
}): boolean {
  const parts = new Map(
    input.signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim() ?? "", value?.trim() ?? ""] as const;
    }),
  );
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) {
    return false;
  }
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(v1);
  return left.length === right.length && timingSafeEqual(left, right);
}
