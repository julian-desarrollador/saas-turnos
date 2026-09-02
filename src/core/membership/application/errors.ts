export type MembershipErrorCode = "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "EXTERNAL";

export type MembershipValidationReason =
  | "EMAIL_INVALID"
  | "ROLE_NOT_INVITABLE"
  | "INVITE_ALREADY_PENDING"
  | "ALREADY_MEMBER"
  | "ORGANIZATION_REQUIRED"
  | "CLERK_FAILED";

export class MembershipError extends Error {
  readonly code: MembershipErrorCode;
  readonly reason?: MembershipValidationReason;
  readonly field?: string;

  constructor(code: MembershipErrorCode, reason?: MembershipValidationReason, field?: string) {
    super(reason ?? code);
    this.name = "MembershipError";
    this.code = code;
    this.reason = reason;
    this.field = field;
  }
}
