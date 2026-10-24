import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import type {
  SiteProfile,
  SiteSnapshot,
  SiteStore,
} from "@/modules/tenant-config/application/ports/site-store";
import { createGetPublicSite } from "@/modules/tenant-config/application/use-cases/get-public-site";
import { createUpdateSiteProfile } from "@/modules/tenant-config/application/use-cases/update-site-profile";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function snapshot(name: string, extra?: Partial<SiteSnapshot>): SiteSnapshot {
  return {
    tenantName: name,
    profile: null,
    address: "Av. Siempre Viva 123",
    phone: "+5491112345678",
    services: [
      { name: "Corte", durationMinutes: 40, priceAmount: 15000, isActive: true },
      { name: "Viejo", durationMinutes: 20, priceAmount: 5000, isActive: false },
    ],
    professionals: [
      { displayName: "Ana", isActive: true },
      { displayName: "Luis", isActive: false },
    ],
    hours: [{ dayOfWeek: 4, startTime: "09:00", endTime: "18:00" }],
    images: { logoKey: null, coverKey: null, photoKeys: [] },
    ...extra,
  };
}

function memoryStore(): SiteStore & { saved: Map<string, SiteProfile> } {
  const rows = new Map<string, SiteSnapshot>([
    [tenantA, snapshot("Peluquería A")],
    [tenantB, snapshot("Peluquería B")],
  ]);
  const saved = new Map<string, SiteProfile>();
  return {
    saved,
    async load(tenantId) {
      return rows.get(tenantId) ?? null;
    },
    async save(tenantId, profile) {
      const current = rows.get(tenantId);
      if (!current) {
        return;
      }
      rows.set(tenantId, { ...current, profile });
      saved.set(tenantId, profile);
    },
    async setImage() {
      return null;
    },
    async addPhoto() {
      return true;
    },
    async removePhoto() {
      return false;
    },
    async countPhotos() {
      return 0;
    },
  };
}

const profile = {
  headline: "Cortes y color",
  about: "Atendemos con turno.",
  brandColor: "rose" as const,
  instagram: "peluqueria",
  published: true,
};

describe("sitio del negocio", () => {
  it("publicar el sitio de A no cambia el de B", async () => {
    const store = memoryStore();
    const update = createUpdateSiteProfile(store);
    const read = createGetPublicSite(store);
    await update({ actor: { tenantId: tenantA, role: "OWNER" }, ...profile });
    const siteB = await read({ tenantId: tenantB, access: "full" });
    assert.equal(siteB?.name, "Peluquería B");
    assert.equal(siteB?.published, false);
    assert.equal("services" in (siteB ?? {}), false);
    const siteA = await read({ tenantId: tenantA, access: "full" });
    assert.equal(siteA?.published, true);
    if (siteA?.published) {
      assert.deepEqual(
        siteA.services.map((service) => service.name),
        ["Corte"],
      );
      assert.deepEqual(
        siteA.professionals.map((professional) => professional.displayName),
        ["Ana"],
      );
    }
    assert.equal(store.saved.has(tenantB), false);
  });

  it("profesional y recepción no editan", async () => {
    const update = createUpdateSiteProfile(memoryStore());
    for (const role of ["PROFESSIONAL", "RECEPTION"] as const) {
      await assert.rejects(
        update({ actor: { tenantId: tenantA, role }, ...profile }),
        ForbiddenError,
      );
    }
  });

  it("rechaza una frase larga, un texto largo, un color ajeno y un instagram inválido", async () => {
    const update = createUpdateSiteProfile(memoryStore());
    const actor = { tenantId: tenantA, role: "OWNER" as const };
    await assert.rejects(
      update({ ...profile, actor, headline: "x".repeat(121) }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "HEADLINE_TOO_LONG",
    );
    await assert.rejects(
      update({ ...profile, actor, about: "x".repeat(1001) }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "ABOUT_TOO_LONG",
    );
    await assert.rejects(
      update({ ...profile, actor, brandColor: "rojo" }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "BRAND_COLOR_INVALID",
    );
    await assert.rejects(
      update({ ...profile, actor, instagram: "hola mundo" }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "INSTAGRAM_INVALID",
    );
  });

  it("sin publicar muestra solo el nombre, y una cuenta cancelada no tiene sitio", async () => {
    const store = memoryStore();
    const read = createGetPublicSite(store);
    const hidden = await read({ tenantId: tenantA, access: "full" });
    assert.deepEqual(hidden, {
      name: "Peluquería A",
      published: false,
      brandColor: "slate",
      logoKey: null,
    });
    assert.equal(await read({ tenantId: tenantA, access: "blocked" }), null);
    await createUpdateSiteProfile(store)({
      actor: { tenantId: tenantA, role: "ADMIN" },
      ...profile,
    });
    const suspended = await read({ tenantId: tenantA, access: "today" });
    assert.equal(suspended?.published, true);
    assert.equal(suspended?.access, "today");
  });
});
