export type PanelLink = {
  path: string;
  label: string;
};

export const mobilePrimaryLinks: readonly PanelLink[] = [
  { path: "agenda", label: "Agenda" },
  { path: "clients", label: "Clientes" },
];

export const mobileMoreLinks: readonly PanelLink[] = [
  { path: "professionals", label: "Equipo" },
  { path: "services", label: "Servicios" },
  { path: "schedule", label: "Horarios" },
];

export const membersLink: PanelLink = { path: "members", label: "Accesos" };

export function isPanelLinkActive(pathname: string, slug: string, path: string): boolean {
  const href = `/${slug}/${path}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
