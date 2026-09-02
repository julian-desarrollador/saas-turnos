export type PanelLink = {
  path: string;
  label: string;
};

export const desktopLinks: readonly PanelLink[] = [
  { path: "dashboard", label: "Inicio" },
  { path: "agenda", label: "Agenda" },
  { path: "clients", label: "Clientes" },
  { path: "professionals", label: "Equipo" },
  { path: "services", label: "Servicios" },
  { path: "schedule", label: "Horarios" },
];

export const mobilePrimaryLinks: readonly PanelLink[] = [
  { path: "agenda", label: "Agenda" },
  { path: "clients", label: "Clientes" },
];

export const mobileMoreLinks: readonly PanelLink[] = [
  { path: "dashboard", label: "Inicio" },
  { path: "professionals", label: "Equipo" },
  { path: "services", label: "Servicios" },
  { path: "schedule", label: "Horarios" },
];

export const membersLink: PanelLink = { path: "members", label: "Accesos" };

export function isPanelLinkActive(pathname: string, slug: string, path: string): boolean {
  const href = `/${slug}/${path}`;
  if (path === "dashboard") {
    return pathname === href || pathname === `/${slug}`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
