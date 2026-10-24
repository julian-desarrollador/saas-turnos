import { assertPermission, type Role } from "@/core/authorization";

import { TenantConfigError } from "../errors";
import type { SiteImageStorage } from "../ports/site-image-storage";
import type { SiteStore } from "../ports/site-store";
import {
  assertSiteImageFile,
  assertSiteImageKind,
  isTenantSiteImageKey,
  SITE_GALLERY_MAX,
} from "../site-image-rules";

export function createConfirmSiteImage(store: SiteStore, storage: SiteImageStorage) {
  return async function confirmSiteImage(input: {
    actor: { tenantId: string; role: Role };
    kind: string;
    key: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "site.write");
    const kind = assertSiteImageKind(input.kind);
    const tenantId = input.actor.tenantId;
    if (!isTenantSiteImageKey(tenantId, input.key)) {
      throw new TenantConfigError("VALIDATION", "IMAGE_KEY_INVALID", "key");
    }
    const stored = await storage.inspect(input.key);
    if (!stored) {
      throw new TenantConfigError("VALIDATION", "IMAGE_NOT_UPLOADED", "key");
    }
    try {
      assertSiteImageFile(stored);
    } catch (error) {
      await storage.remove(input.key);
      throw error;
    }

    if (kind === "gallery") {
      const added = await store.addPhoto(tenantId, input.key, SITE_GALLERY_MAX);
      if (!added) {
        await storage.remove(input.key);
        throw new TenantConfigError("VALIDATION", "GALLERY_FULL", "file");
      }
      return;
    }

    const previous = await store.setImage(tenantId, kind, input.key);
    if (previous && previous !== input.key) {
      await storage.remove(previous);
    }
  };
}
