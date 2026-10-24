import { assertPermission, type Role } from "@/core/authorization";

import { assertSiteProfile } from "../site-rules";
import type { SiteStore } from "../ports/site-store";

export function createUpdateSiteProfile(store: SiteStore) {
  return async function updateSiteProfile(input: {
    actor: { tenantId: string; role: Role };
    headline: string;
    about: string;
    brandColor: string;
    instagram: string | null;
    published: boolean;
  }): Promise<void> {
    assertPermission(input.actor.role, "site.write");
    const profile = assertSiteProfile(input);
    await store.save(input.actor.tenantId, profile);
  };
}
