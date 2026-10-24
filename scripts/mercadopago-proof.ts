import { config } from "dotenv";

import {
  isPlanCode,
  monthlyArs,
  remainingTrialDays,
  trialEndsAt,
} from "../src/modules/billing/domain/subscription";

config({ path: ".env.local" });

async function main(): Promise<void> {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  const planRaw = process.env["MERCADOPAGO_PROOF_PLAN"] ?? "INICIO";
  const email = process.env["MERCADOPAGO_PROOF_EMAIL"];

  if (!token || !email) {
    console.error(
      "Falta MERCADOPAGO_ACCESS_TOKEN o MERCADOPAGO_PROOF_EMAIL. Sin eso no se puede probar el débito.",
    );
    process.exit(2);
  }
  if (!isPlanCode(planRaw)) {
    console.error("MERCADOPAGO_PROOF_PLAN tiene que ser INICIO, NEGOCIO o EQUIPO.");
    process.exit(2);
  }

  const now = new Date();
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Prueba plan ${planRaw}`,
      payer_email: email,
      back_url: "https://saas-turnos-omega.vercel.app/alta",
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: monthlyArs(planRaw),
        currency_id: "ARS",
        free_trial: {
          frequency: remainingTrialDays(
            { status: "TRIAL", trialEndsAt: trialEndsAt(now), graceEndsAt: null },
            now,
          ),
          frequency_type: "days",
        },
      },
    }),
  });

  const body = (await response.json()) as { id?: string; message?: string; cause?: unknown };
  if (!response.ok || !body.id) {
    console.error("Mercado Pago no aceptó la suscripción de prueba.", response.status);
    console.error(JSON.stringify({ message: body.message, cause: body.cause }));
    process.exit(1);
  }

  console.log(
    `Suscripción de prueba creada: ${body.id}. El débito en pesos lo hace Mercado Pago si el pagador completa el checkout.`,
  );
}

void main();
