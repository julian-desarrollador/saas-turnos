import { panelPath } from "@/core/panel-routes";

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

export const siteLink: PanelLink = { path: "sitio", label: "Sitio" };

export function isPanelLinkActive(pathname: string, slug: string, path: string): boolean {
  const href = panelPath(slug, path);
  return pathname === href || pathname.startsWith(`${href}/`);
}
