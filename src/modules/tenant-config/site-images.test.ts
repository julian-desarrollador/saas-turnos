import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import type {
  SiteImageStorage,
  StoredImage,
} from "@/modules/tenant-config/application/ports/site-image-storage";
import type {
  SiteImages,
  SiteSnapshot,
  SiteStore,
} from "@/modules/tenant-config/application/ports/site-store";
import { createConfirmSiteImage } from "@/modules/tenant-config/application/use-cases/confirm-site-image";
import { createGetPublicSite } from "@/modules/tenant-config/application/use-cases/get-public-site";
import { createRemoveSiteImage } from "@/modules/tenant-config/application/use-cases/remove-site-image";
import { createRequestSiteImageUpload } from "@/modules/tenant-config/application/use-cases/request-site-image-upload";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const owner = { tenantId: tenantA, role: "OWNER" as const };

function keyOf(tenantId: string, n: number, ext = "jpg") {
  return `tenants/${tenantId}/site/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.${ext}`;
}

function emptyImages(): SiteImages {
  return { logoKey: null, coverKey: null, photoKeys: [] };
}

function memoryStore() {
  const images = new Map<string, SiteImages>([
    [tenantA, emptyImages()],
    [tenantB, emptyImages()],
  ]);
  const store: SiteStore = {
    async load(tenantId) {
      const current = images.get(tenantId);
      if (!current) {
        return null;
      }
      const snapshot: SiteSnapshot = {
        tenantName: tenantId === tenantA ? "Peluquería A" : "Peluquería B",
        profile: { headline: "", about: "", brandColor: "slate", instagram: null, published: true },
        address: null,
        phone: null,
        services: [],
        professionals: [],
        hours: [],
        images: { ...current, photoKeys: [...current.photoKeys] },
      };
      return snapshot;
    },
    async save() {},
    async setImage(tenantId, slot, key) {
      const current = images.get(tenantId) ?? emptyImages();
      const previous = slot === "logo" ? current.logoKey : current.coverKey;
      images.set(
        tenantId,
        slot === "logo" ? { ...current, logoKey: key } : { ...current, coverKey: key },
      );
      return previous;
    },
    async addPhoto(tenantId, key, max) {
      const current = images.get(tenantId) ?? emptyImages();
      if (current.photoKeys.length >= max) {
        return false;
      }
      images.set(tenantId, { ...current, photoKeys: [...current.photoKeys, key] });
      return true;
    },
    async removePhoto(tenantId, key) {
      const current = images.get(tenantId) ?? emptyImages();
      if (!current.photoKeys.includes(key)) {
        return false;
      }
      images.set(tenantId, { ...current, photoKeys: current.photoKeys.filter((k) => k !== key) });
      return true;
    },
    async countPhotos(tenantId) {
      return images.get(tenantId)?.photoKeys.length ?? 0;
    },
  };
  return { store, images };
}

function memoryStorage() {
  const objects = new Map<string, StoredImage>();
  const removed: string[] = [];
  const signed: { key: string; contentType: string; size: number }[] = [];
  const storage: SiteImageStorage = {
    async createUploadUrl(input) {
      signed.push(input);
      return `https://r2.test/${input.key}?firma=1`;
    },
    async inspect(key) {
      return objects.get(key) ?? null;
    },
    async remove(key) {
      removed.push(key);
      objects.delete(key);
    },
  };
  return { storage, objects, removed, signed };
}

function sequentialIds() {
  let n = 0;
  return () => {
    n += 1;
    return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  };
}

describe("fotos del sitio", () => {
  it("arma la clave dentro de la carpeta del negocio y firma el tipo y el tamaño", async () => {
    const { store } = memoryStore();
    const { storage, signed } = memoryStorage();
    const request = createRequestSiteImageUpload(store, storage, sequentialIds());
    const upload = await request({
      actor: owner,
      kind: "cover",
      contentType: "image/webp",
      size: 2_000,
    });
    assert.equal(upload.key, keyOf(tenantA, 1, "webp"));
    assert.equal(upload.uploadUrl, `https://r2.test/${keyOf(tenantA, 1, "webp")}?firma=1`);
    assert.deepEqual(signed, [
      { key: keyOf(tenantA, 1, "webp"), contentType: "image/webp", size: 2_000 },
    ]);
  });

  it("rechaza un archivo que no es JPEG, PNG o WebP y uno de más de 5 MB", async () => {
    const { store } = memoryStore();
    const { storage, signed } = memoryStorage();
    const request = createRequestSiteImageUpload(store, storage, sequentialIds());
    await assert.rejects(
      request({ actor: owner, kind: "logo", contentType: "image/gif", size: 1_000 }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_TYPE_INVALID",
    );
    await assert.rejects(
      request({ actor: owner, kind: "logo", contentType: "image/png", size: 5 * 1024 * 1024 + 1 }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "IMAGE_TOO_LARGE",
    );
    await assert.rejects(
      request({ actor: owner, kind: "logo", contentType: "constructor", size: 1_000 }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_TYPE_INVALID",
    );
    await assert.rejects(
      request({ actor: owner, kind: "fondo", contentType: "image/png", size: 1_000 }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_KIND_INVALID",
    );
    assert.equal(signed.length, 0);
  });

  it("profesional y recepción no suben, no confirman ni quitan fotos", async () => {
    const { store } = memoryStore();
    const { storage } = memoryStorage();
    const request = createRequestSiteImageUpload(store, storage, sequentialIds());
    const confirm = createConfirmSiteImage(store, storage);
    const remove = createRemoveSiteImage(store, storage);
    for (const role of ["PROFESSIONAL", "RECEPTION"] as const) {
      const actor = { tenantId: tenantA, role };
      await assert.rejects(
        request({ actor, kind: "logo", contentType: "image/png", size: 1_000 }),
        ForbiddenError,
      );
      await assert.rejects(
        confirm({ actor, kind: "logo", key: keyOf(tenantA, 1) }),
        ForbiddenError,
      );
      await assert.rejects(remove({ actor, kind: "logo" }), ForbiddenError);
    }
  });

  it("el negocio A no confirma una foto subida en la carpeta de B", async () => {
    const { store, images } = memoryStore();
    const { storage, objects } = memoryStorage();
    objects.set(keyOf(tenantB, 1), { contentType: "image/jpeg", size: 1_000 });
    const confirm = createConfirmSiteImage(store, storage);
    await assert.rejects(
      confirm({ actor: owner, kind: "cover", key: keyOf(tenantB, 1) }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_KEY_INVALID",
    );
    await assert.rejects(
      confirm({ actor: owner, kind: "cover", key: `tenants/${tenantA}/site/../otra.jpg` }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_KEY_INVALID",
    );
    assert.equal(images.get(tenantA)?.coverKey, null);
    assert.equal(objects.has(keyOf(tenantB, 1)), true);
  });

  it("no confirma una foto que no se subió, y borra la que no cumple la regla", async () => {
    const { store, images } = memoryStore();
    const { storage, objects, removed } = memoryStorage();
    const confirm = createConfirmSiteImage(store, storage);
    await assert.rejects(
      confirm({ actor: owner, kind: "logo", key: keyOf(tenantA, 1) }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "IMAGE_NOT_UPLOADED",
    );
    objects.set(keyOf(tenantA, 2), { contentType: "image/jpeg", size: 6 * 1024 * 1024 });
    await assert.rejects(
      confirm({ actor: owner, kind: "logo", key: keyOf(tenantA, 2) }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "IMAGE_TOO_LARGE",
    );
    assert.deepEqual(removed, [keyOf(tenantA, 2)]);
    assert.equal(images.get(tenantA)?.logoKey, null);
  });

  it("cambiar el logo borra el anterior del almacenamiento", async () => {
    const { store, images } = memoryStore();
    const { storage, objects, removed } = memoryStorage();
    const confirm = createConfirmSiteImage(store, storage);
    objects.set(keyOf(tenantA, 1), { contentType: "image/png", size: 1_000 });
    objects.set(keyOf(tenantA, 2), { contentType: "image/png", size: 1_000 });
    await confirm({ actor: owner, kind: "logo", key: keyOf(tenantA, 1) });
    await confirm({
      actor: { tenantId: tenantA, role: "ADMIN" },
      kind: "logo",
      key: keyOf(tenantA, 2),
    });
    assert.equal(images.get(tenantA)?.logoKey, keyOf(tenantA, 2));
    assert.deepEqual(removed, [keyOf(tenantA, 1)]);
  });

  it("la galería acepta hasta 8 fotos", async () => {
    const { store, images } = memoryStore();
    const { storage, objects } = memoryStorage();
    const request = createRequestSiteImageUpload(store, storage, sequentialIds());
    const confirm = createConfirmSiteImage(store, storage);
    for (let n = 1; n <= 8; n += 1) {
      objects.set(keyOf(tenantA, n), { contentType: "image/jpeg", size: 1_000 });
      await confirm({ actor: owner, kind: "gallery", key: keyOf(tenantA, n) });
    }
    assert.equal(images.get(tenantA)?.photoKeys.length, 8);
    await assert.rejects(
      request({ actor: owner, kind: "gallery", contentType: "image/jpeg", size: 1_000 }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "GALLERY_FULL",
    );
    objects.set(keyOf(tenantA, 9), { contentType: "image/jpeg", size: 1_000 });
    await assert.rejects(
      confirm({ actor: owner, kind: "gallery", key: keyOf(tenantA, 9) }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "GALLERY_FULL",
    );
    assert.equal(objects.has(keyOf(tenantA, 9)), false);
  });

  it("el negocio A no quita una foto de la galería de B", async () => {
    const { store, images } = memoryStore();
    const { storage, objects, removed } = memoryStorage();
    objects.set(keyOf(tenantB, 1), { contentType: "image/jpeg", size: 1_000 });
    await createConfirmSiteImage(
      store,
      storage,
    )({
      actor: { tenantId: tenantB, role: "OWNER" },
      kind: "gallery",
      key: keyOf(tenantB, 1),
    });
    const remove = createRemoveSiteImage(store, storage);
    await assert.rejects(
      remove({ actor: owner, kind: "gallery", key: keyOf(tenantB, 1) }),
      (error: unknown) => error instanceof TenantConfigError && error.code === "NOT_FOUND",
    );
    assert.deepEqual(images.get(tenantB)?.photoKeys, [keyOf(tenantB, 1)]);
    assert.deepEqual(removed, []);
  });

  it("quitar la portada la saca del sitio y del almacenamiento", async () => {
    const { store } = memoryStore();
    const { storage, objects, removed } = memoryStorage();
    objects.set(keyOf(tenantA, 1), { contentType: "image/jpeg", size: 1_000 });
    await createConfirmSiteImage(
      store,
      storage,
    )({ actor: owner, kind: "cover", key: keyOf(tenantA, 1) });
    await createRemoveSiteImage(store, storage)({ actor: owner, kind: "cover" });
    assert.deepEqual(removed, [keyOf(tenantA, 1)]);
    const site = await createGetPublicSite(store)({ tenantId: tenantA, access: "full" });
    assert.ok(site?.published);
    assert.equal(site.images.coverKey, null);
  });

  it("el sitio publicado muestra logo, portada y galería, y el de B no ve las de A", async () => {
    const { store } = memoryStore();
    const { storage, objects } = memoryStorage();
    const confirm = createConfirmSiteImage(store, storage);
    objects.set(keyOf(tenantA, 1), { contentType: "image/png", size: 1_000 });
    objects.set(keyOf(tenantA, 2), { contentType: "image/jpeg", size: 1_000 });
    objects.set(keyOf(tenantA, 3), { contentType: "image/jpeg", size: 1_000 });
    await confirm({ actor: owner, kind: "logo", key: keyOf(tenantA, 1) });
    await confirm({ actor: owner, kind: "cover", key: keyOf(tenantA, 2) });
    await confirm({ actor: owner, kind: "gallery", key: keyOf(tenantA, 3) });
    const read = createGetPublicSite(store);
    const siteA = await read({ tenantId: tenantA, access: "full" });
    assert.ok(siteA?.published);
    assert.deepEqual(siteA.images, {
      logoKey: keyOf(tenantA, 1),
      coverKey: keyOf(tenantA, 2),
      photoKeys: [keyOf(tenantA, 3)],
    });
    const siteB = await read({ tenantId: tenantB, access: "full" });
    assert.ok(siteB?.published);
    assert.deepEqual(siteB.images, emptyImages());
  });
});
