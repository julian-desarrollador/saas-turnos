import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "@/generated/prisma/client";
import { withExplicitPgSsl } from "@/lib/pg-connection-string";
import { createPrismaAvailabilityRepository } from "@/modules/booking/adapters/outbound/prisma-availability-repository";
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

async function deleteTenants(owner: PrismaClient, ids: string[]) {
  if (ids.length === 0) {
    return;
  }
  // El servicio no se borra en cascada mientras un turno lo referencia.
  await owner.appointment.deleteMany({ where: { tenantId: { in: ids } } });
  await owner.tenant.deleteMany({ where: { id: { in: ids } } });
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

    it("deja una sola reserva cuando dos clientes piden el último cupo", async () => {
      if (!appUrl || !ownerUrl) {
        return;
      }
      const owner = clientFor(ownerUrl);
      const app = clientFor(appUrl);
      const suffix = randomUUID().slice(0, 8);
      const tenantIds: string[] = [];

      try {
        const leftovers = await owner.tenant.findMany({
          where: {
            OR: [{ slug: { startsWith: "race-a-" } }, { slug: { startsWith: "race-b-" } }],
          },
          select: { id: true },
        });
        await deleteTenants(
          owner,
          leftovers.map((row) => row.id),
        );

        const tenantA = await owner.tenant.create({
          data: {
            slug: `race-a-${suffix}`,
            name: "Negocio A",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        const tenantB = await owner.tenant.create({
          data: {
            slug: `race-b-${suffix}`,
            name: "Negocio B",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        tenantIds.push(tenantA.id, tenantB.id);

        const branch = await owner.branch.create({
          data: { tenantId: tenantA.id, name: "Sede", phone: "+5491112345678" },
        });
        const professional = await owner.professional.create({
          data: { tenantId: tenantA.id, branchId: branch.id, displayName: "Ana" },
        });
        const service = await owner.service.create({
          data: {
            tenantId: tenantA.id,
            name: "Corte",
            durationMinutes: 30,
            priceAmount: 1000,
          },
        });
        await owner.professionalService.create({
          data: {
            tenantId: tenantA.id,
            professionalId: professional.id,
            serviceId: service.id,
          },
        });
        await owner.weeklySchedule.createMany({
          data: [
            {
              tenantId: tenantA.id,
              branchId: branch.id,
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "18:00",
              capacity: 1,
            },
            {
              tenantId: tenantA.id,
              professionalId: professional.id,
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "18:00",
              capacity: 1,
            },
          ],
        });
        const clientOne = await owner.client.create({
          data: { tenantId: tenantA.id, phone: `+54911${suffix}1` },
        });
        const clientTwo = await owner.client.create({
          data: { tenantId: tenantA.id, phone: `+54911${suffix}2` },
        });

        const reserve = createPrismaAvailabilityRepository(app, createTenantDb(app)).reserveSlot;
        const input = {
          tenantId: tenantA.id,
          professionalId: professional.id,
          serviceId: service.id,
          localDate: "2026-09-28",
          localTime: "10:00",
          now: new Date("2026-09-25T15:00:00.000Z"),
          origin: "PUBLIC" as const,
        };
        const [first, second] = await Promise.all([
          reserve({ ...input, clientId: clientOne.id }),
          reserve({ ...input, clientId: clientTwo.id }),
        ]);
        const outcomes = [first.status, second.status].sort();
        assert.deepEqual(outcomes, ["created", "unavailable"]);

        const other = await createTenantDb(app).run(tenantB.id, (tx) =>
          tx.appointment.count({ where: { tenantId: tenantB.id } }),
        );
        assert.equal(other, 0);
      } finally {
        await deleteTenants(owner, tenantIds);
        await owner.$disconnect();
        await app.$disconnect();
      }
    });

    it("esconde el sitio de otro negocio y no deja cambiarlo", async () => {
      if (!appUrl || !ownerUrl) {
        return;
      }
      const owner = clientFor(ownerUrl);
      const app = clientFor(appUrl);
      const suffix = randomUUID().slice(0, 8);
      const tenantIds: string[] = [];

      try {
        const tenantA = await owner.tenant.create({
          data: {
            slug: `site-a-${suffix}`,
            name: "Sitio A",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        const tenantB = await owner.tenant.create({
          data: {
            slug: `site-b-${suffix}`,
            name: "Sitio B",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        tenantIds.push(tenantA.id, tenantB.id);
        await owner.tenantSite.create({
          data: { tenantId: tenantA.id, headline: "Frase A", published: true },
        });
        await owner.tenantSite.create({
          data: { tenantId: tenantB.id, headline: "Frase B", published: true },
        });

        const seen = await createTenantDb(app).run(tenantA.id, (tx) => tx.tenantSite.findMany());
        assert.equal(seen.length, 1);
        assert.equal(seen[0]?.headline, "Frase A");

        await assert.rejects(
          createTenantDb(app).run(tenantA.id, (tx) =>
            tx.tenantSite.update({
              where: { tenantId: tenantB.id },
              data: { headline: "Ajeno" },
            }),
          ),
        );
        const untouched = await owner.tenantSite.findUnique({ where: { tenantId: tenantB.id } });
        assert.equal(untouched?.headline, "Frase B");
      } finally {
        await deleteTenants(owner, tenantIds);
        await owner.$disconnect();
        await app.$disconnect();
      }
    });

    it("las fotos de la galería de otro negocio no se ven ni se borran", async () => {
      if (!appUrl || !ownerUrl) {
        return;
      }
      const owner = clientFor(ownerUrl);
      const app = clientFor(appUrl);
      const suffix = randomUUID().slice(0, 8);
      const tenantIds: string[] = [];

      try {
        const tenantA = await owner.tenant.create({
          data: {
            slug: `foto-a-${suffix}`,
            name: "Fotos A",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        const tenantB = await owner.tenant.create({
          data: {
            slug: `foto-b-${suffix}`,
            name: "Fotos B",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        tenantIds.push(tenantA.id, tenantB.id);
        const keyA = `tenants/${tenantA.id}/site/${randomUUID()}.jpg`;
        const keyB = `tenants/${tenantB.id}/site/${randomUUID()}.jpg`;
        await owner.tenantSitePhoto.create({
          data: { tenantId: tenantA.id, key: keyA, position: 1 },
        });
        await owner.tenantSitePhoto.create({
          data: { tenantId: tenantB.id, key: keyB, position: 1 },
        });

        const seen = await createTenantDb(app).run(tenantA.id, (tx) =>
          tx.tenantSitePhoto.findMany(),
        );
        assert.deepEqual(
          seen.map((photo) => photo.key),
          [keyA],
        );
        const removed = await createTenantDb(app).run(tenantA.id, (tx) =>
          tx.tenantSitePhoto.deleteMany({ where: { key: keyB } }),
        );
        assert.equal(removed.count, 0);
        assert.equal(await owner.tenantSitePhoto.count({ where: { tenantId: tenantB.id } }), 1);
      } finally {
        await deleteTenants(owner, tenantIds);
        await owner.$disconnect();
        await app.$disconnect();
      }
    });

    it("el hash de un celular no devuelve turnos de otro negocio", async () => {
      if (!appUrl || !ownerUrl) {
        return;
      }
      const owner = clientFor(ownerUrl);
      const app = clientFor(appUrl);
      const suffix = randomUUID().slice(0, 8);
      const tenantIds: string[] = [];

      try {
        const tenantA = await owner.tenant.create({
          data: {
            slug: `dev-a-${suffix}`,
            name: "Celular A",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        const tenantB = await owner.tenant.create({
          data: {
            slug: `dev-b-${suffix}`,
            name: "Celular B",
            timezone: "America/Argentina/Buenos_Aires",
          },
        });
        tenantIds.push(tenantA.id, tenantB.id);
        const hash = `hash-${suffix}`;
        for (const [index, tenant] of [tenantA, tenantB].entries()) {
          const branch = await owner.branch.create({
            data: { tenantId: tenant.id, name: "Sede" },
          });
          const professional = await owner.professional.create({
            data: { tenantId: tenant.id, branchId: branch.id, displayName: "Ana" },
          });
          const client = await owner.client.create({
            data: { tenantId: tenant.id, phone: `+54911${suffix}${index}` },
          });
          await owner.appointment.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              professionalId: professional.id,
              clientId: client.id,
              status: "CONFIRMED",
              origin: "PUBLIC",
              publicDeviceHash: hash,
              localDate: "2026-10-20",
              localTime: "10:00",
              timezone: "America/Argentina/Buenos_Aires",
              startsAt: new Date("2026-10-20T13:00:00.000Z"),
              endsAt: new Date("2026-10-20T13:30:00.000Z"),
              durationMinutes: 30,
            },
          });
        }
        const seen = await createPrismaAvailabilityRepository(
          app,
          createTenantDb(app),
        ).listDeviceAppointments(tenantA.id, hash);
        assert.equal(seen.length, 1);
        assert.equal(seen[0]?.localDate, "2026-10-20");
      } finally {
        await deleteTenants(owner, tenantIds);
        await owner.$disconnect();
        await app.$disconnect();
      }
    });
  },
);
