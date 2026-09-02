export type BookingErrorCode = "NOT_FOUND" | "VALIDATION" | "CONFLICT";

export type BookingValidationReason =
  | "DATE_INVALID"
  | "TIME_INVALID"
  | "SERVICE_NOT_OFFERED"
  | "SLOT_UNAVAILABLE"
  | "ALREADY_CANCELLED"
  | "NOT_CANCELLABLE"
  | "ALREADY_NO_SHOW"
  | "NOT_NO_SHOWABLE"
  | "ALREADY_COMPLETED"
  | "NOT_COMPLETABLE"
  | "NOT_MOVABLE"
  | "NO_CHANGE";

export class BookingError extends Error {
  readonly code: BookingErrorCode;
  readonly reason?: BookingValidationReason;
  readonly field?: string;

  constructor(code: BookingErrorCode, reason?: BookingValidationReason, field?: string) {
    super(reason ?? code);
    this.name = "BookingError";
    this.code = code;
    this.reason = reason;
    this.field = field;
  }
}

export function notFound(): never {
  throw new BookingError("NOT_FOUND");
}
