import { assertPermission, type Role } from "@/core/authorization";

import { TenantConfigError } from "../errors";
import type { SiteProfile, SiteStore } from "../ports/site-store";

const emptyProfile: SiteProfile = {
  headline: "",
  about: "",
  brandColor: "slate",
  instagram: null,
  published: false,
};

export function createGetSiteEditor(store: SiteStore) {
  return async function getSiteEditor(actor: { tenantId: string; role: Role }) {
    assertPermission(actor.role, "site.write");
    const snapshot = await store.load(actor.tenantId);
    if (!snapshot) {
      throw new TenantConfigError("NOT_FOUND");
    }
    return {
      profile: snapshot.profile ?? emptyProfile,
      name: snapshot.tenantName,
      address: snapshot.address,
      phone: snapshot.phone,
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
