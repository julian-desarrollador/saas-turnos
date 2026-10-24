import { assertPermission, type Role } from "@/core/authorization";

import { notFound } from "../errors";
import type { SiteImageStorage } from "../ports/site-image-storage";
import type { SiteStore } from "../ports/site-store";
import { assertSiteImageKind } from "../site-image-rules";

export function createRemoveSiteImage(store: SiteStore, storage: SiteImageStorage) {
  return async function removeSiteImage(input: {
    actor: { tenantId: string; role: Role };
    kind: string;
    key?: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "site.write");
    const kind = assertSiteImageKind(input.kind);
    const tenantId = input.actor.tenantId;

    if (kind === "gallery") {
      if (!input.key || !(await store.removePhoto(tenantId, input.key))) {
        notFound();
      }
      await storage.remove(input.key);
      return;
    }

    const previous = await store.setImage(tenantId, kind, null);
    if (previous) {
      await storage.remove(previous);
    }
  };
}
