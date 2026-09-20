export type ClientsErrorCode = "NOT_FOUND" | "VALIDATION" | "CONFLICT";

export type ClientsValidationReason = "PHONE_INVALID" | "NAME_TOO_LONG" | "QUERY_TOO_LONG";

export type ClientsConflictReason = "PHONE_TAKEN";

export type ClientsErrorReason = ClientsValidationReason | ClientsConflictReason;

export class ClientsError extends Error {
  readonly code: ClientsErrorCode;
  readonly reason?: ClientsErrorReason;
  readonly field?: string;

  constructor(code: ClientsErrorCode, reason?: ClientsErrorReason, field?: string) {
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
