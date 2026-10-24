import { TenantConfigError } from "./errors";

export const SITE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SITE_GALLERY_MAX = 8;

const extensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const siteImageTypes = [...extensions.keys()];

export type SiteImageKind = "logo" | "cover" | "gallery";

export function assertSiteImageKind(kind: string): SiteImageKind {
  if (kind === "logo" || kind === "cover" || kind === "gallery") {
    return kind;
  }
  throw new TenantConfigError("VALIDATION", "IMAGE_KIND_INVALID", "kind");
}

export function assertSiteImageFile(file: { contentType: string; size: number }): string {
  const extension = extensions.get(file.contentType);
  if (!extension) {
    throw new TenantConfigError("VALIDATION", "IMAGE_TYPE_INVALID", "file");
  }
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > SITE_IMAGE_MAX_BYTES) {
    throw new TenantConfigError("VALIDATION", "IMAGE_TOO_LARGE", "file");
  }
  return extension;
}

export function siteImageKey(tenantId: string, id: string, extension: string): string {
  return `tenants/${tenantId}/site/${id}.${extension}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isTenantSiteImageKey(tenantId: string, key: string): boolean {
  const pattern = new RegExp(`^tenants/${tenantId}/site/${UUID}\\.(jpg|png|webp)$`);
  return pattern.test(key);
}
