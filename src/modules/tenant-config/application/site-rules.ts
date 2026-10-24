import { TenantConfigError } from "./errors";
import { brandColors, type BrandColor, type SiteProfile } from "./ports/site-store";

const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

export function assertSiteProfile(input: {
  headline: string;
  about: string;
  brandColor: string;
  instagram: string | null;
  published: boolean;
}): SiteProfile {
  const headline = input.headline.trim();
  const about = input.about.trim();
  if (headline.length > 120) {
    throw new TenantConfigError("VALIDATION", "HEADLINE_TOO_LONG", "headline");
  }
  if (about.length > 1000) {
    throw new TenantConfigError("VALIDATION", "ABOUT_TOO_LONG", "about");
  }
  if (!(brandColors as readonly string[]).includes(input.brandColor)) {
    throw new TenantConfigError("VALIDATION", "BRAND_COLOR_INVALID", "brandColor");
  }
  const instagram = input.instagram?.trim().replace(/^@/, "") ?? "";
  if (instagram && !INSTAGRAM.test(instagram)) {
    throw new TenantConfigError("VALIDATION", "INSTAGRAM_INVALID", "instagram");
  }
  return {
    headline,
    about,
    brandColor: input.brandColor as BrandColor,
    instagram: instagram || null,
    published: input.published,
  };
}
