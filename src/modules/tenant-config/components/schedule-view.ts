export const WEEKDAYS = [
  { day: 1, label: "Lunes", short: "Lun" },
  { day: 2, label: "Martes", short: "Mar" },
  { day: 3, label: "Miércoles", short: "Mié" },
  { day: 4, label: "Jueves", short: "Jue" },
  { day: 5, label: "Viernes", short: "Vie" },
  { day: 6, label: "Sábado", short: "Sáb" },
  { day: 0, label: "Domingo", short: "Dom" },
] as const;

export type WeekSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  branchId?: string | null;
  professionalId?: string | null;
};

export type ScheduleOwnerSummary = {
  kind: "branch" | "professional";
  id: string;
  displayName: string;
  isActive: boolean;
  hasSchedule: boolean;
  weekLabel: string;
};

export function slotsForOwner(
  slots: WeekSlot[],
  kind: "branch" | "professional",
  id: string,
): WeekSlot[] {
  if (kind === "branch") {
    return slots.filter((slot) => slot.branchId === id && slot.professionalId == null);
  }
  return slots.filter((slot) => slot.professionalId === id && slot.branchId == null);
}

function rangesForDay(slots: WeekSlot[], day: number): string {
  return slots
    .filter((slot) => slot.dayOfWeek === day)
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .map((slot) => `${slot.startTime}–${slot.endTime}`)
    .join(" y ");
}

function dayRangeLabel(indices: number[]): string {
  const shorts = indices.flatMap((index) => {
    const weekday = WEEKDAYS[index];
    return weekday ? [weekday.short] : [];
  });
  const first = shorts[0];
  const last = shorts[shorts.length - 1];
  if (!first || !last) {
    return "";
  }
  if (shorts.length === 1) {
    return first;
  }
  const consecutive = indices.every((index, offset) => {
    const previous = indices[offset - 1];
    return previous === undefined || index === previous + 1;
  });
  if (consecutive) {
    return `${first} a ${last}`;
  }
  return shorts.join(", ");
}

/** Texto de la card: “Lun a Vie · 09:00–18:00” o “Sin horario cargado”. */
export function weekSummary(slots: WeekSlot[]): string {
  const openIndices = WEEKDAYS.map((weekday, index) => ({
    index,
    ranges: rangesForDay(slots, weekday.day),
  }))
    .filter((item) => item.ranges !== "")
    .map((item) => item.index);

  if (openIndices.length === 0) {
    return "Sin horario cargado";
  }

  const uniqueRanges = [
    ...new Set(
      openIndices.map((index) => {
        const weekday = WEEKDAYS[index];
        return weekday ? rangesForDay(slots, weekday.day) : "";
      }),
    ),
  ];
  const days = dayRangeLabel(openIndices);
  if (uniqueRanges.length === 1 && uniqueRanges[0]) {
    return `${days} · ${uniqueRanges[0]}`;
  }
  return days;
}

export function branchScheduleCards(
  branches: { id: string; name: string }[],
  slots: WeekSlot[],
): ScheduleOwnerSummary[] {
  return branches.map((branch) => {
    const ownerSlots = slotsForOwner(slots, "branch", branch.id);
    return {
      kind: "branch" as const,
      id: branch.id,
      displayName: branch.name,
      isActive: true,
      hasSchedule: ownerSlots.length > 0,
      weekLabel: weekSummary(ownerSlots),
    };
  });
}

export function professionalScheduleCards(
  professionals: { id: string; displayName: string; isActive: boolean }[],
  slots: WeekSlot[],
): ScheduleOwnerSummary[] {
  return professionals
    .map((professional) => {
      const ownerSlots = slotsForOwner(slots, "professional", professional.id);
      return {
        kind: "professional" as const,
        id: professional.id,
        displayName: professional.displayName,
        isActive: professional.isActive,
        hasSchedule: ownerSlots.length > 0,
        weekLabel: weekSummary(ownerSlots),
      };
    })
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }
      return left.displayName.localeCompare(right.displayName, "es");
    });
}

export function scheduleOwnerHref(
  slug: string,
  kind: "branch" | "professional",
  id: string,
): string {
  if (kind === "branch") {
    return `/${slug}/schedule/sucursal/${id}`;
  }
  return `/${slug}/schedule/profesional/${id}`;
}

export function scheduleToastMessage(who: string): string | null {
  if (!who.trim()) {
    return "Horario guardado";
  }
  return `Horario guardado · ${who.trim()}`;
}

export function capacityQuestion(kind: "branch" | "professional"): string {
  return kind === "branch"
    ? "¿Cuántos turnos caben a la vez en el local?"
    : "¿Cuántos turnos atiende a la vez?";
}
