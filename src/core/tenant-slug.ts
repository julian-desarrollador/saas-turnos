const TENANT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "alta",
  "sign-in",
  "sign-up",
  "terminos",
  "privacidad",
]);

/** Segmento de primer nivel que puede ser un negocio (ADR-003). */
export function isTenantSlug(value: string): boolean {
  return TENANT_SLUG.test(value);
}

/** Segmentos de primer nivel que no son un negocio. */
export function isReservedTenantSlug(value: string): boolean {
  return RESERVED_SLUGS.has(value);
}
