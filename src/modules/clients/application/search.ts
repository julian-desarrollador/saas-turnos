import { normalizePhone } from "../domain/phone";
import type { ClientSearchTerm } from "./ports/client-repository";

const LETTER = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/;
const PHONE_CONTAINS_MIN_DIGITS = 4;

export const CLIENT_QUERY_MAX = 100;
export const CLIENT_LIST_LIMIT = 100;
export const CLIENT_APPOINTMENT_LIMIT = 100;

export function parseClientSearch(raw: string): ClientSearchTerm[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (!LETTER.test(trimmed)) {
    const phoneExact = normalizePhone(trimmed);
    if (phoneExact) {
      return [{ name: null, phoneExact, phoneContains: null }];
    }
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= PHONE_CONTAINS_MIN_DIGITS) {
      return [{ name: null, phoneExact: null, phoneContains: digits }];
    }
  }

  return trimmed.split(/\s+/).map((token): ClientSearchTerm => {
    const phoneExact = normalizePhone(token);
    if (phoneExact) {
      return { name: null, phoneExact, phoneContains: null };
    }

    const digits = token.replace(/\D/g, "");
    const phoneContains = digits.length >= PHONE_CONTAINS_MIN_DIGITS ? digits : null;
    if (phoneContains && !LETTER.test(token)) {
      return { name: null, phoneExact: null, phoneContains };
    }

    return { name: token, phoneExact: null, phoneContains };
  });
}

export function clientMatchesSearch(
  client: { phone: string; firstName: string | null; lastName: string | null },
  terms: ClientSearchTerm[],
): boolean {
  if (terms.length === 0) {
    return true;
  }

  return terms.every((term) => termMatches(client, term));
}

function termMatches(
  client: { phone: string; firstName: string | null; lastName: string | null },
  term: ClientSearchTerm,
): boolean {
  if (term.phoneExact && client.phone === term.phoneExact) {
    return true;
  }
  if (term.phoneContains && client.phone.includes(term.phoneContains)) {
    return true;
  }
  if (term.name && includesInsensitive(client.firstName, term.name)) {
    return true;
  }
  if (term.name && includesInsensitive(client.lastName, term.name)) {
    return true;
  }
  return false;
}

function includesInsensitive(haystack: string | null, needle: string): boolean {
  if (!haystack) {
    return false;
  }
  return haystack.toLocaleLowerCase("es").includes(needle.toLocaleLowerCase("es"));
}

export function compareClientRecords(
  left: { lastName: string | null; firstName: string | null; phone: string },
  right: { lastName: string | null; firstName: string | null; phone: string },
): number {
  return (
    compareOptionalName(left.lastName, right.lastName) ||
    compareOptionalName(left.firstName, right.firstName) ||
    left.phone.localeCompare(right.phone, "es")
  );
}

function compareOptionalName(left: string | null, right: string | null): number {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return 1;
  }
  if (!right) {
    return -1;
  }
  return left.localeCompare(right, "es");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isClientId(value: string): boolean {
  return UUID_RE.test(value);
}
