export type TenantConfigErrorCode = "NOT_FOUND" | "VALIDATION";

export type TenantConfigValidationReason =
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "DURATION_MUST_BE_POSITIVE"
  | "PRICE_MUST_BE_NON_NEGATIVE"
  | "PREP_MUST_BE_NON_NEGATIVE"
  | "CLEANUP_MUST_BE_NON_NEGATIVE"
  | "INVALID_TIME"
  | "INVALID_TIME_RANGE"
  | "COLOR_INVALID"
  | "BRANCH_REQUIRED"
  | "SERVICES_NOT_IN_TENANT"
  | "DAY_OF_WEEK_INVALID"
  | "CAPACITY_MUST_BE_POSITIVE"
  | "SLOTS_OVERLAP"
  | "SCHEDULE_OWNER_REQUIRED"
  | "DATE_INVALID"
  | "DATE_RANGE_INVALID"
  | "BLOCK_TIME_INCOMPLETE"
  | "BLOCKS_OVERLAP"
  | "REASON_TOO_LONG";

export class TenantConfigError extends Error {
  readonly code: TenantConfigErrorCode;
  readonly reason?: TenantConfigValidationReason;
  readonly field?: string;

  constructor(code: TenantConfigErrorCode, reason?: TenantConfigValidationReason, field?: string) {
    super(reason ?? code);
    this.name = "TenantConfigError";
    this.code = code;
    this.reason = reason;
    this.field = field;
  }
}

export function notFound(): never {
  throw new TenantConfigError("NOT_FOUND");
}
