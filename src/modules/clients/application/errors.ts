export type ClientsErrorCode = "NOT_FOUND" | "VALIDATION";

export type ClientsValidationReason = "PHONE_INVALID" | "NAME_TOO_LONG" | "QUERY_TOO_LONG";

export class ClientsError extends Error {
  readonly code: ClientsErrorCode;
  readonly reason?: ClientsValidationReason;
  readonly field?: string;

  constructor(code: ClientsErrorCode, reason?: ClientsValidationReason, field?: string) {
    super(reason ?? code);
    this.name = "ClientsError";
    this.code = code;
    this.reason = reason;
    this.field = field;
  }
}

export function notFound(): never {
  throw new ClientsError("NOT_FOUND");
}
