import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "@/generated/prisma/client";
import { withExplicitPgSsl } from "@/lib/pg-connection-string";
import { createTenantDb } from "@/server/tenant-db";

config({ path: ".env.local" });

// Corre con `node`, fuera de Next. No usa src/lib/env/server: ese módulo
// exige Clerk y `server-only`, y esta prueba no levanta la aplicación.
// eslint-disable-next-line no-restricted-properties
const appUrl = process.env["TEST_DATABASE_URL"];
// eslint-disable-next-line no-restricted-properties
const ownerUrl = process.env["TEST_DIRECT_URL"];
const ready = Boolean(appUrl && ownerUrl);

if (!ready) {
  console.log(
    "pnpm test:db: faltan TEST_DATABASE_URL (rol saas_app) y TEST_DIRECT_URL (rol dueño) de la rama de prueba. No se tocó ninguna base.",
  );
}

function clientFor(url: string) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: withExplicitPgSsl(url) }),
  });
}

describe(
  "RLS con rol saas_app",
  { skip: ready ? false : "faltan las URLs de la rama de prueba" },
  () => {
    it("esconde las filas de otro negocio y rechaza escribirlas", async () => {
      if (!appUrl || !ownerUrl) {
        return;
      }
      const owner = clientFor(ownerUrl);
      const app = clientFor(appUrl);
      const suffix = randomUUID().slice(0, 8);
      const tenantIds: string[] = [];

      try {
        const role = await app.$queryRaw<Array<{ rolbypassrls: boolean }>>`
        SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user
      `;
        assert.equal(role[0]?.rolbypassrls, false);

        const tenantA = await owner.tenant.create({
          data: {
            slug: `rls-a-${suffix}`,
            name: "Negocio A",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        const tenantB = await owner.tenant.create({
          data: {
            slug: `rls-b-${suffix}`,
            name: "Negocio B",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        tenantIds.push(tenantA.id, tenantB.id);

        const clientA = await owner.client.create({
          data: { tenantId: tenantA.id, phone: `+54911${suffix}1` },
        });
        const clientB = await owner.client.create({
          data: { tenantId: tenantB.id, phone: `+54911${suffix}2` },
        });

        const hidden = await app.client.findMany({
          where: { id: { in: [clientA.id, clientB.id] } },
        });
        assert.equal(hidden.length, 0);

        const seen = await createTenantDb(app).run(tenantA.id, (tx) =>
          tx.client.findMany({
            where: { id: { in: [clientA.id, clientB.id] } },
            select: { id: true },
          }),
        );
        assert.deepEqual(
          seen.map((row) => row.id),
          [clientA.id],
        );

        await assert.rejects(
          () =>
            createTenantDb(app).run(tenantA.id, (tx) =>
              tx.client.create({
                data: { tenantId: tenantB.id, phone: `+54911${suffix}3` },
              }),
            ),
          (error: unknown) =>
            error instanceof Error && error.message.toLowerCase().includes("row-level security"),
        );
      } finally {
        if (tenantIds.length > 0) {
          await owner.tenant.deleteMany({ where: { id: { in: tenantIds } } });
        }
        await owner.$disconnect();
        await app.$disconnect();
      }
    });
  },
);
