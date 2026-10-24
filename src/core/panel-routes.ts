/** Dirección del panel de un negocio. El primer segmento después del slug es siempre `panel`. */
export function panelPath(slug: string, path = ""): string {
  const base = `/${slug}/panel`;
  const rest = path.replace(/^\//, "");
  return rest ? `${base}/${rest}` : base;
}
