const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLocalDate(value: string): boolean {
  const match = LOCAL_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function fromAgenda(from: string | null | undefined, date: string | null | undefined): boolean {
  return from === "agenda" && Boolean(date && isLocalDate(date));
}

/** Destino de la flecha: agenda del día si se abrió desde ahí; si no, listado. */
export function clientFichaBackHref(
  slug: string,
  from?: string | null,
  date?: string | null,
): string {
  if (fromAgenda(from, date) && date) {
    const params = new URLSearchParams();
    params.set("date", date);
    return `/${slug}/agenda?${params.toString()}`;
  }
  return `/${slug}/clients`;
}

export function clientFichaBackAriaLabel(from?: string | null, date?: string | null): string {
  return fromAgenda(from, date) ? "Volver a la agenda" : "Volver a clientes";
}

export function clientFichaHref(
  slug: string,
  clientId: string,
  query?: { from?: string | null; date?: string | null; saved?: boolean },
): string {
  const params = new URLSearchParams();
  if (fromAgenda(query?.from, query?.date) && query?.date) {
    params.set("from", "agenda");
    params.set("date", query.date);
  }
  if (query?.saved) {
    params.set("saved", "1");
  }
  const search = params.toString();
  return search ? `/${slug}/clients/${clientId}?${search}` : `/${slug}/clients/${clientId}`;
}

/** Enlace a la ficha desde un turno, para volver al mismo día. */
export function clientFichaFromAgendaHref(slug: string, clientId: string, date: string): string {
  return clientFichaHref(slug, clientId, { from: "agenda", date });
}

export function clientFichaToastMessage(saved?: string | null): string | null {
  return saved === "1" ? "Cambios guardados" : null;
}
