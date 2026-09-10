export type ProfessionalSummary = {
  id: string;
  displayName: string;
  isActive: boolean;
  serviceCount: number;
  hasSchedule: boolean;
};

/** Profesionales con al menos una franja semanal propia: sin franja no hay huecos. */
export function scheduledProfessionalIds(slots: { professionalId: string | null }[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of slots) {
    if (slot.professionalId) {
      ids.add(slot.professionalId);
    }
  }
  return ids;
}

/** Resumen de cada tarjeta de Equipo, con los activos primero y por nombre. */
export function professionalSummaries(
  professionals: {
    id: string;
    displayName: string;
    isActive: boolean;
    serviceIds: string[];
  }[],
  withSchedule: Set<string>,
): ProfessionalSummary[] {
  return professionals
    .map((professional) => ({
      id: professional.id,
      displayName: professional.displayName,
      isActive: professional.isActive,
      serviceCount: professional.serviceIds.length,
      hasSchedule: withSchedule.has(professional.id),
    }))
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }
      return left.displayName.localeCompare(right.displayName, "es");
    });
}

export type TeamToastKind = "created" | "saved" | "activated" | "deactivated";

const TEAM_TOAST_TEXTS: Record<TeamToastKind, string> = {
  created: "Profesional agregado",
  saved: "Cambios guardados",
  activated: "Profesional activado",
  deactivated: "Profesional desactivado",
};

export function teamToastMessage(kind: TeamToastKind | null, who: string): string | null {
  if (!kind) {
    return null;
  }
  const text = TEAM_TOAST_TEXTS[kind];
  return who.trim() ? `${text} · ${who.trim()}` : text;
}

export function serviceCountLabel(count: number): string {
  if (count === 0) {
    return "Sin servicios asignados";
  }
  if (count === 1) {
    return "1 servicio";
  }
  return `${count} servicios`;
}
