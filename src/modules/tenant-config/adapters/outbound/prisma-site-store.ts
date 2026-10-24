import type { TenantDb } from "@/server/tenant-db";

import {
  brandColors,
  type BrandColor,
  type SiteProfile,
  type SiteStore,
} from "../../application/ports/site-store";

function asBrandColor(value: string): BrandColor {
  return (brandColors as readonly string[]).includes(value) ? (value as BrandColor) : "slate";
}

function toProfile(row: {
  headline: string;
  about: string;
  brandColor: string;
  instagram: string | null;
  published: boolean;
}): SiteProfile {
  return {
    headline: row.headline,
    about: row.about,
    brandColor: asBrandColor(row.brandColor),
    instagram: row.instagram,
    published: row.published,
  };
}

export function createPrismaSiteStore(tenantDb: TenantDb): SiteStore {
  return {
    async load(tenantId) {
      return tenantDb.run(tenantId, async (tx) => {
        const tenant = await tx.tenant.findFirst({
          where: { id: tenantId },
          select: { name: true },
        });
        if (!tenant) {
          return null;
        }
        const site = await tx.tenantSite.findUnique({ where: { tenantId } });
        const photos = await tx.tenantSitePhoto.findMany({
          where: { tenantId },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { key: true },
        });
        const branch = await tx.branch.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: "asc" },
          select: { id: true, address: true, phone: true },
        });
        const services = await tx.service.findMany({
          where: { tenantId },
          orderBy: { name: "asc" },
          select: { name: true, durationMinutes: true, priceAmount: true, isActive: true },
        });
        const professionals = await tx.professional.findMany({
          where: { tenantId },
          orderBy: { displayName: "asc" },
          select: { displayName: true, isActive: true },
        });
        const hours = branch
          ? await tx.weeklySchedule.findMany({
              where: { tenantId, branchId: branch.id, professionalId: null },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              select: { dayOfWeek: true, startTime: true, endTime: true },
            })
          : [];
        return {
          tenantName: tenant.name,
          profile: site ? toProfile(site) : null,
          images: {
            logoKey: site?.logoKey ?? null,
            coverKey: site?.coverKey ?? null,
            photoKeys: photos.map((photo) => photo.key),
          },
          address: branch?.address ?? null,
          phone: branch?.phone ?? null,
          services,
          professionals,
          hours,
        };
      });
    },
    async save(tenantId, profile) {
      await tenantDb.run(tenantId, (tx) =>
        tx.tenantSite.upsert({
          where: { tenantId },
          create: { tenantId, ...profile },
          update: profile,
        }),
      );
    },
    async setImage(tenantId, slot, key) {
      const data = slot === "logo" ? { logoKey: key } : { coverKey: key };
      return tenantDb.run(tenantId, async (tx) => {
        const current = await tx.tenantSite.findUnique({
          where: { tenantId },
          select: { logoKey: true, coverKey: true },
        });
        await tx.tenantSite.upsert({
          where: { tenantId },
          create: { tenantId, ...data },
          update: data,
        });
        return (slot === "logo" ? current?.logoKey : current?.coverKey) ?? null;
      });
    },
    async addPhoto(tenantId, key, max) {
      return tenantDb.run(tenantId, async (tx) => {
        await tx.tenantSite.upsert({ where: { tenantId }, create: { tenantId }, update: {} });
        await tx.$queryRaw`SELECT 1 FROM "tenant_sites" WHERE "tenant_id" = ${tenantId}::uuid FOR UPDATE`;
        const count = await tx.tenantSitePhoto.count({ where: { tenantId } });
        if (count >= max) {
          return false;
        }
        const last = await tx.tenantSitePhoto.findFirst({
          where: { tenantId },
          orderBy: { position: "desc" },
          select: { position: true },
        });
        await tx.tenantSitePhoto.create({
          data: { tenantId, key, position: (last?.position ?? 0) + 1 },
        });
        return true;
      });
    },
    async removePhoto(tenantId, key) {
      return tenantDb.run(tenantId, async (tx) => {
        const removed = await tx.tenantSitePhoto.deleteMany({ where: { tenantId, key } });
        return removed.count > 0;
      });
    },
    async countPhotos(tenantId) {
      return tenantDb.run(tenantId, (tx) => tx.tenantSitePhoto.count({ where: { tenantId } }));
    },
  };
}
