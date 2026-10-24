import { assertPermission, type Role } from "@/core/authorization";

import { TenantConfigError } from "../errors";
import type { SiteImageStorage } from "../ports/site-image-storage";
import type { SiteStore } from "../ports/site-store";
import {
  assertSiteImageFile,
  assertSiteImageKind,
  SITE_GALLERY_MAX,
  siteImageKey,
} from "../site-image-rules";

export function createRequestSiteImageUpload(
  store: SiteStore,
  storage: SiteImageStorage,
  newId: () => string = () => crypto.randomUUID(),
) {
  return async function requestSiteImageUpload(input: {
    actor: { tenantId: string; role: Role };
    kind: string;
    contentType: string;
    size: number;
  }): Promise<{ key: string; uploadUrl: string }> {
    assertPermission(input.actor.role, "site.write");
    const kind = assertSiteImageKind(input.kind);
    const extension = assertSiteImageFile(input);
    if (kind === "gallery" && (await store.countPhotos(input.actor.tenantId)) >= SITE_GALLERY_MAX) {
      throw new TenantConfigError("VALIDATION", "GALLERY_FULL", "file");
    }
    const key = siteImageKey(input.actor.tenantId, newId(), extension);
    const uploadUrl = await storage.createUploadUrl({
      key,
      contentType: input.contentType,
      size: input.size,
    });
    return { key, uploadUrl };
  };
}
