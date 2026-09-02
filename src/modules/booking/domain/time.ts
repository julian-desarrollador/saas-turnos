export const SLOT_STEP_MINUTES = 15;
export const MINUTES_IN_DAY = 24 * 60;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isLocalDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
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

export function dayOfWeekFromLocalDate(localDate: string): number {
  const match = DATE_PATTERN.exec(localDate);
  if (!match) {
    throw new Error("INVALID_LOCAL_DATE");
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCDay();
}

export function timeToMinutes(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) {
    throw new Error("INVALID_TIME");
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Etiqueta de duración para UI (es): "50 min", "1 h", "1 h 30 min". */
export function formatDurationLabel(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${minutes} min`;
}

export function isLocalTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function addLocalDays(localDate: string, days: number): string {
  const match = DATE_PATTERN.exec(localDate);
  if (!match) {
    throw new Error("INVALID_LOCAL_DATE");
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  let hour = Number(partValue(parts, "hour"));
  if (hour === 24) {
    hour = 0;
  }
  return {
    year: Number(partValue(parts, "year")),
    month: Number(partValue(parts, "month")),
    day: Number(partValue(parts, "day")),
    hour,
    minute: Number(partValue(parts, "minute")),
  };
}

export function zonedCivilNow(
  timeZone: string,
  now: Date,
): { localDate: string; minuteOfDay: number } {
  const parts = zonedParts(now, timeZone);
  const localDate = `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return { localDate, minuteOfDay: parts.hour * 60 + parts.minute };
}

export function localDateTimeToUtc(localDate: string, localTime: string, timeZone: string): Date {
  if (!isLocalDate(localDate) || !isLocalTime(localTime)) {
    throw new Error("INVALID_LOCAL_DATETIME");
  }
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  const minuteOfDay = timeToMinutes(localTime);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const wanted = Date.UTC(year, month - 1, day, hour, minute);

  let millis = wanted;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const got = zonedParts(new Date(millis), timeZone);
    const gotAsUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
    const delta = gotAsUtc - wanted;
    if (
      delta === 0 &&
      got.year === year &&
      got.month === month &&
      got.day === day &&
      got.hour === hour &&
      got.minute === minute
    ) {
      return new Date(millis);
    }
    millis -= delta;
  }
  throw new Error("INVALID_ZONED_DATETIME");
}
