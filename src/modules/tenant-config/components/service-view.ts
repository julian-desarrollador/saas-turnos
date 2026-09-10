export type ServiceSummary = {
  id: string;
  name: string;
  isActive: boolean;
  durationMinutes: number;
  priceAmount: number;
  offeredByCount: number;
};

export function serviceDurationLabel(durationMinutes: number): string {
  return `${durationMinutes} min`;
}

export function servicePriceLabel(priceAmount: number): string {
  return `$${priceAmount.toLocaleString("es-AR")}`;
}

export function serviceMetaLabel(durationMinutes: number, priceAmount: number): string {
  return `${serviceDurationLabel(durationMinutes)} · ${servicePriceLabel(priceAmount)}`;
}

export function offeredByCounts(professionals: { serviceIds: string[] }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const professional of professionals) {
    for (const serviceId of professional.serviceIds) {
      counts.set(serviceId, (counts.get(serviceId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Resumen de cada tarjeta, con los activos primero y por nombre. */
export function serviceSummaries(
  services: {
    id: string;
    name: string;
    isActive: boolean;
    durationMinutes: number;
    priceAmount: number;
  }[],
  professionals: { serviceIds: string[] }[],
): ServiceSummary[] {
  const counts = offeredByCounts(professionals);
  return services
    .map((service) => ({
      id: service.id,
      name: service.name,
      isActive: service.isActive,
      durationMinutes: service.durationMinutes,
      priceAmount: service.priceAmount,
      offeredByCount: counts.get(service.id) ?? 0,
    }))
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "es");
    });
}

export type ServiceToastKind = "created" | "saved" | "activated" | "deactivated";

const SERVICE_TOAST_TEXTS: Record<ServiceToastKind, string> = {
  created: "Servicio agregado",
  saved: "Cambios guardados",
  activated: "Servicio activado",
  deactivated: "Servicio desactivado",
};

export function serviceToastMessage(kind: ServiceToastKind | null, who: string): string | null {
  if (!kind) {
    return null;
  }
  const text = SERVICE_TOAST_TEXTS[kind];
  return who.trim() ? `${text} · ${who.trim()}` : text;
}

/** Prep, limpieza o ventana de horario: Más opciones nace abierto. */
export function moreOptionsShouldOpen(service: {
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
}): boolean {
  return (
    service.prepMinutes > 0 ||
    service.cleanupMinutes > 0 ||
    Boolean(service.earliestStart) ||
    Boolean(service.latestStart)
  );
}
