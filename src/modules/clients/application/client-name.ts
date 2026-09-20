import { ClientsError } from "./errors";

export const CLIENT_NAME_MAX = 100;

export function assertOptionalClientName(value: string | null, field = "firstName"): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > CLIENT_NAME_MAX) {
    throw new ClientsError("VALIDATION", "NAME_TOO_LONG", field);
  }
  return trimmed;
}
