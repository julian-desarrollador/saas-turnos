import { parseArgs } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { withExplicitPgSsl } from "../src/lib/pg-connection-string";
import { createPrismaSubscriptionStore } from "../src/modules/billing/adapters/outbound/prisma-subscription-store";
import { BillingError } from "../src/modules/billing/application/errors";
import { createApplyPeriodPayment } from "../src/modules/billing/application/use-cases/apply-period-payment";

config({ path: ".env.local" });

const usage =
  "Uso: pnpm billing:credit --slug <negocio> --months <1|12> --amount <pesos> --ref <comprobante>";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      months: { type: "string" },
      amount: { type: "string" },
      ref: { type: "string" },
    },
  });
  const months = Number(values.months);
  const amountArs = Number(values.amount);
  if (!values.slug || !values.ref || !Number.isFinite(months) || !Number.isFinite(amountArs)) {
    console.error(usage);
    process.exit(2);
  }

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    console.error("Falta DATABASE_URL en .env.local.");
    process.exit(2);
  }
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: withExplicitPgSsl(connectionString) }),
  });

  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: values.slug },
      select: { id: true },
    });
    if (!tenant) {
      console.error(`No existe el negocio ${values.slug}.`);
      process.exit(1);
    }
    const result = await createApplyPeriodPayment(createPrismaSubscriptionStore(db))({
      eventId: `manual:${values.ref}`,
      tenantId: tenant.id,
      months,
      amountArs,
      now: new Date(),
    });
    const after = await db.tenant.findUnique({
      where: { id: tenant.id },
      select: { periodEndsAt: true },
    });
    console.log(
      result === "duplicate"
        ? `El comprobante ${values.ref} ya estaba acreditado. No se cambió nada.`
        : `Acreditado. ${values.slug} queda pagado hasta ${after?.periodEndsAt?.toISOString()}.`,
    );
  } catch (error) {
    if (error instanceof BillingError) {
      console.error(`No se acreditó: ${error.reason ?? error.code}.`);
      process.exit(1);
    }
    throw error;
  } finally {
    await db.$disconnect();
  }
}

void main();
