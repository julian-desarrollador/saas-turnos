import "server-only";

import { cache } from "react";

import { isTenantSlug } from "@/core/tenant-slug";
import { createGetPublicSite } from "@/modules/tenant-config/application/use-cases/get-public-site";
import { createPrismaSiteStore } from "@/modules/tenant-config/adapters/outbound/prisma-site-store";
import { brandAccent } from "@/modules/tenant-config/components/brand-style";
import { findPublicTenant } from "@/server/public-tenant";
import { tenantDb } from "@/server/db";
import { siteImageUrl } from "@/server/site-images";

const getPublicSite = createGetPublicSite(createPrismaSiteStore(tenantDb));

export type PublicSiteImages = {
  logo: string | null;
  cover: string | null;
  gallery: string[];
};

export const loadPublicSiteBySlug = cache(async (slug: string) => {
  if (!isTenantSlug(slug)) {
    return null;
  }
  const tenant = await findPublicTenant(slug);
  if (!tenant || tenant.access === "blocked") {
    return null;
  }
  const site = await getPublicSite({ tenantId: tenant.id, access: tenant.access });
  if (!site) {
    return null;
  }
  const images: PublicSiteImages = site.published
    ? {
        logo: siteImageUrl(site.images.logoKey),
        cover: siteImageUrl(site.images.coverKey),
        gallery: site.images.photoKeys.flatMap((key) => siteImageUrl(key) ?? []),
      }
    : { logo: siteImageUrl(site.logoKey), cover: null, gallery: [] };
  return {
    slug: tenant.slug,
    access: tenant.access,
    site,
    images,
    accent: brandAccent[site.brandColor],
  };
});
