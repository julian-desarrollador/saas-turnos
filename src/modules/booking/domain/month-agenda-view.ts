import { blockOverlapsDate, isCancelledOrNoShow } from "./month-grid";

/** Días con actividad visible (turnos no ocultos y/o bloqueos). */
export function activityDates(
  appointments: { localDate: string; status: string }[],
  blocks: { startDate: string; endDate: string }[],
  showCancelled: boolean,
  dateKeys: string[],
): Set<string> {
  const active = new Set<string>();
  for (const appointment of appointments) {
    if (!showCancelled && isCancelledOrNoShow(appointment.status)) {
      continue;
    }
    active.add(appointment.localDate);
  }
  for (const dateKey of dateKeys) {
    if (blocks.some((block) => blockOverlapsDate(block, dateKey))) {
      active.add(dateKey);
    }
  }
  return active;
}

export function dayAppointments<
  T extends { id: string; localDate: string; localTime: string; status: string },
>(appointments: T[], localDate: string, showCancelled: boolean): T[] {
  return appointments
    .filter((row) => {
      if (row.localDate !== localDate) {
        return false;
      }
      if (!showCancelled && isCancelledOrNoShow(row.status)) {
        return false;
      }
      return true;
    })
    .sort(
      (left, right) =>
        left.localTime.localeCompare(right.localTime) || left.id.localeCompare(right.id),
    );
}

export function dayBlocks<
  T extends { id: string; startDate: string; endDate: string; startTime: string | null },
>(blocks: T[], localDate: string): T[] {
  return blocks
    .filter((block) => blockOverlapsDate(block, localDate))
    .sort((left, right) => {
      const leftTime = left.startTime ?? "00:00";
      const rightTime = right.startTime ?? "00:00";
      return leftTime.localeCompare(rightTime) || left.id.localeCompare(right.id);
    });
}

export function cancelledCountOnDay(
  appointments: { localDate: string; status: string }[],
  localDate: string,
): number {
  return appointments.filter(
    (row) => row.localDate === localDate && isCancelledOrNoShow(row.status),
  ).length;
}

/** Al cambiar de mes: conservar el día si sigue en el mes; si no, hoy o el 1. */
export function selectedDateForMonth(
  yearMonth: string,
  selectedDate: string,
  today: string,
): string {
  if (selectedDate.startsWith(yearMonth)) {
    return selectedDate;
  }
  if (today.startsWith(yearMonth)) {
    return today;
  }
  return `${yearMonth}-01`;
}
