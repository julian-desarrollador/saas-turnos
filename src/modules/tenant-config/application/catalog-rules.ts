import { TenantConfigError } from "./errors";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const NAME_MAX = 120;

export function assertName(name: string, field: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new TenantConfigError("VALIDATION", "NAME_REQUIRED", field);
  }
  if (trimmed.length > NAME_MAX) {
    throw new TenantConfigError("VALIDATION", "NAME_TOO_LONG", field);
  }
  return trimmed;
}

export function assertPositiveDuration(durationMinutes: number): void {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new TenantConfigError("VALIDATION", "DURATION_MUST_BE_POSITIVE", "durationMinutes");
  }
}

export function assertNonNegativeAmount(
  value: number,
  field: string,
  reason:
    "PRICE_MUST_BE_NON_NEGATIVE" | "PREP_MUST_BE_NON_NEGATIVE" | "CLEANUP_MUST_BE_NON_NEGATIVE",
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new TenantConfigError("VALIDATION", reason, field);
  }
}

export function assertOptionalColor(color: string | null): string | null {
  if (color === null || color === "") {
    return null;
  }
  if (!COLOR_PATTERN.test(color)) {
    throw new TenantConfigError("VALIDATION", "COLOR_INVALID", "color");
  }
  return color;
}

export function assertOptionalTime(value: string | null, field: string): string | null {
  if (value === null || value === "") {
    return null;
  }
  if (!TIME_PATTERN.test(value)) {
    throw new TenantConfigError("VALIDATION", "INVALID_TIME", field);
  }
  return value;
}

export function assertRequiredTime(value: string, field: string): string {
  const time = assertOptionalTime(value, field);
  if (!time) {
    throw new TenantConfigError("VALIDATION", "INVALID_TIME", field);
  }
  return time;
}

export function assertTimeRange(earliestStart: string | null, latestStart: string | null): void {
  if (earliestStart && latestStart && earliestStart > latestStart) {
    throw new TenantConfigError("VALIDATION", "INVALID_TIME_RANGE", "latestStart");
  }
}
