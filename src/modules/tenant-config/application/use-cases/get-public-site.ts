import type { CommercialAccess } from "@/modules/billing/domain/subscription";

import type { BrandColor, SiteImages, SiteStore } from "../ports/site-store";

export type PublicSiteView =
  | { name: string; published: false; brandColor: BrandColor; logoKey: string | null }
  | {
      name: string;
      published: true;
      access: Exclude<CommercialAccess, "blocked">;
      headline: string;
      about: string;
      brandColor: BrandColor;
      instagram: string | null;
      phone: string | null;
      address: string | null;
      services: { name: string; durationMinutes: number; priceAmount: number }[];
      professionals: { displayName: string }[];
      hours: { dayOfWeek: number; startTime: string; endTime: string }[];
      images: SiteImages;
    };

export function createGetPublicSite(store: SiteStore) {
  return async function getPublicSite(input: {
    tenantId: string;
    access: CommercialAccess;
  }): Promise<PublicSiteView | null> {
    if (input.access === "blocked") {
      return null;
    }
    const snapshot = await store.load(input.tenantId);
    if (!snapshot) {
      return null;
    }
    if (!snapshot.profile?.published) {
      return {
        name: snapshot.tenantName,
        published: false,
        brandColor: snapshot.profile?.brandColor ?? "slate",
        logoKey: snapshot.images.logoKey,
      };
    }
    return {
      name: snapshot.tenantName,
      published: true,
      access: input.access,
      headline: snapshot.profile.headline,
      about: snapshot.profile.about,
      brandColor: snapshot.profile.brandColor,
      instagram: snapshot.profile.instagram,
      phone: snapshot.phone,
      address: snapshot.address,
      services: snapshot.services
        .filter((service) => service.isActive)
        .map(({ name, durationMinutes, priceAmount }) => ({ name, durationMinutes, priceAmount })),
      professionals: snapshot.professionals
        .filter((professional) => professional.isActive)
        .map(({ displayName }) => ({ displayName })),
      hours: snapshot.hours,
      images: snapshot.images,
    };
  };
}
