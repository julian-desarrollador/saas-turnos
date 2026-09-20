import { TenantConfigError } from "./errors";
import { assertOptionalTime, assertRequiredTime } from "./catalog-rules";
import type { WeeklySlotInput } from "./ports/schedule-repository";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const REASON_MAX = 255;

export function assertDayOfWeek(dayOfWeek: number): number {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new TenantConfigError("VALIDATION", "DAY_OF_WEEK_INVALID", "dayOfWeek");
  }
  return dayOfWeek;
}

export function assertCapacity(capacity: number): number {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new TenantConfigError("VALIDATION", "CAPACITY_MUST_BE_POSITIVE", "capacity");
  }
  return capacity;
}

export function assertWeeklySlots(slots: WeeklySlotInput[]): WeeklySlotInput[] {
  const normalized = slots.map((slot) => {
    const dayOfWeek = assertDayOfWeek(slot.dayOfWeek);
    const startTime = assertRequiredTime(slot.startTime, "startTime");
    const endTime = assertRequiredTime(slot.endTime, "endTime");
    if (startTime >= endTime) {
      throw new TenantConfigError("VALIDATION", "INVALID_TIME_RANGE", "endTime");
    }
    return {
      dayOfWeek,
      startTime,
      endTime,
      capacity: assertCapacity(slot.capacity),
    };
  });

  const byDay = new Map<number, WeeklySlotInput[]>();
  for (const slot of normalized) {
    const daySlots = byDay.get(slot.dayOfWeek) ?? [];
    daySlots.push(slot);
    byDay.set(slot.dayOfWeek, daySlots);
  }

  for (const daySlots of byDay.values()) {
    const sorted = [...daySlots].sort((left, right) =>
      left.startTime.localeCompare(right.startTime),
    );
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous && current && previous.endTime > current.startTime) {
        throw new TenantConfigError("VALIDATION", "SLOTS_OVERLAP", "startTime");
      }
    }
  }

  return normalized;
}

export function assertDate(value: string, field: string): string {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    throw new TenantConfigError("VALIDATION", "DATE_INVALID", field);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new TenantConfigError("VALIDATION", "DATE_INVALID", field);
  }

  return value;
}

export function assertDateRange(startDate: string, endDate: string): void {
  if (startDate > endDate) {
    throw new TenantConfigError("VALIDATION", "DATE_RANGE_INVALID", "endDate");
  }
}

function formatUtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addUtcDays(isoDate: string, days: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return formatUtcDate(new Date(Date.UTC(year, month - 1, day + days)));
}

export function eachInclusiveDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addUtcDays(current, 1);
  }
  return dates;
}

export function assertOptionalBlockTimes(
  startTime: string | null,
  endTime: string | null,
): { startTime: string | null; endTime: string | null } {
  const start = assertOptionalTime(startTime, "startTime");
  const end = assertOptionalTime(endTime, "endTime");
  if ((start === null) !== (end === null)) {
    throw new TenantConfigError("VALIDATION", "BLOCK_TIME_INCOMPLETE", "endTime");
  }
  if (start && end && start >= end) {
    throw new TenantConfigError("VALIDATION", "INVALID_TIME_RANGE", "endTime");
  }
  return { startTime: start, endTime: end };
}

const MINUTES_IN_DAY = 24 * 60;

function timeToMinutes(value: string): number {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function blockInterval(
  startTime: string | null,
  endTime: string | null,
): { start: number; end: number } {
  if (!startTime && !endTime) {
    return { start: 0, end: MINUTES_IN_DAY };
  }
  return {
    start: timeToMinutes(startTime ?? "00:00"),
    end: timeToMinutes(endTime ?? "24:00"),
  };
}

export type CalendarBlockWindow = {
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
};

export function calendarBlocksOverlap(
  left: CalendarBlockWindow,
  right: CalendarBlockWindow,
): boolean {
  if (left.startDate > right.endDate || right.startDate > left.endDate) {
    return false;
  }
  const leftInterval = blockInterval(left.startTime, left.endTime);
  const rightInterval = blockInterval(right.startTime, right.endTime);
  return leftInterval.start < rightInterval.end && rightInterval.start < leftInterval.end;
}

export function blockMatchesOwner(
  block: { branchId: string | null; professionalId: string | null },
  owner: { kind: "branch" | "professional"; id: string },
): boolean {
  if (owner.kind === "branch") {
    return block.branchId === owner.id && block.professionalId === null;
  }
  return block.professionalId === owner.id && block.branchId === null;
}

export function assertOptionalReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  const trimmed = reason.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > REASON_MAX) {
    throw new TenantConfigError("VALIDATION", "REASON_TOO_LONG", "reason");
  }
  return trimmed;
}
