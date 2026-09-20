const TENANT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Segmento de primer nivel que puede ser un negocio (ADR-003). */
export function isTenantSlug(value: string): boolean {
  return TENANT_SLUG.test(value);
}
