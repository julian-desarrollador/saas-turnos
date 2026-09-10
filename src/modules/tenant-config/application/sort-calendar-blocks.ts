import type { CalendarBlockRecord } from "./ports/schedule-repository";

function startTimeKey(value: string | null): string {
  return value ?? "00:00";
}

function endTimeKey(value: string | null): string {
  return value ?? "24:00";
}

export function compareCalendarBlocksSoonestFirst(
  left: CalendarBlockRecord,
  right: CalendarBlockRecord,
): number {
  if (left.startDate !== right.startDate) {
    return left.startDate.localeCompare(right.startDate);
  }
  const startCmp = startTimeKey(left.startTime).localeCompare(startTimeKey(right.startTime));
  if (startCmp !== 0) {
    return startCmp;
  }
  if (left.endDate !== right.endDate) {
    return left.endDate.localeCompare(right.endDate);
  }
  const endCmp = endTimeKey(left.endTime).localeCompare(endTimeKey(right.endTime));
  if (endCmp !== 0) {
    return endCmp;
  }
  return left.id.localeCompare(right.id);
}

export function sortCalendarBlocksSoonestFirst(
  blocks: CalendarBlockRecord[],
): CalendarBlockRecord[] {
  return [...blocks].sort(compareCalendarBlocksSoonestFirst);
}
