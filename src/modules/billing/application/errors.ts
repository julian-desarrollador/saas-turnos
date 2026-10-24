export type BillingErrorCode = "VALIDATION" | "CONFLICT" | "EXTERNAL";

export type BillingReason =
  | "NAME_INVALID"
  | "SLUG_INVALID"
  | "SLUG_RESERVED"
  | "SLUG_TAKEN"
  | "TIMEZONE_INVALID"
  | "PLAN_INVALID"
  | "EMAIL_INVALID"
  | "PHONE_INVALID"
  | "CLERK_FAILED"
  | "PROVISION_FAILED"
  | "PAYMENT_FAILED"
  | "NOT_CONFIGURED"
  | "PERIOD_INVALID"
  | "AMOUNT_TOO_LOW"
  | "ALREADY_LINKED"
  | "SUBSCRIPTION_CANCELLED"
  | "TENANT_NOT_FOUND";

export class BillingError extends Error {
  readonly code: BillingErrorCode;
  readonly reason?: BillingReason;
  readonly field?: string;

  constructor(code: BillingErrorCode, reason?: BillingReason, field?: string) {
    super(reason ?? code);
    this.name = "BillingError";
    this.code = code;
    this.reason = reason;
    this.field = field;
  }
}
