import { assertPermission } from "@/core/authorization";

import { normalizePhone } from "../../domain/phone";
import { assertOptionalClientName } from "../client-name";
import { ClientsError } from "../errors";
import type { ClientRecord, ClientRepository, ClientsActor } from "../ports/client-repository";

function ownerName(client: Pick<ClientRecord, "firstName" | "lastName">): string {
  return [client.firstName, client.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function sameClientName(
  typed: string,
  client: Pick<ClientRecord, "firstName" | "lastName">,
): boolean {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-AR");
  const typedName = normalize(typed);
  const first = client.firstName ? normalize(client.firstName) : "";
  const full = normalize(ownerName(client));
  return typedName === first || typedName === full;
}

export function conflictingOwnerName(
  existing: Pick<ClientRecord, "firstName" | "lastName"> | null,
  typedName: string | null,
): string | null {
  const firstName = assertOptionalClientName(typedName);
  if (!existing?.firstName || !firstName || sameClientName(firstName, existing)) {
    return null;
  }
  return ownerName(existing);
}

async function resolveExisting(
  repo: ClientRepository,
  tenantId: string,
  existing: ClientRecord,
  firstName: string | null,
  acceptExisting: boolean,
): Promise<ClientRecord> {
  if (!acceptExisting) {
    const conflict = conflictingOwnerName(existing, firstName);
    if (conflict) {
      throw new ClientsError("CONFLICT", "PHONE_OWNER_MISMATCH", "phone", conflict);
    }
  }
  if (firstName && !existing.firstName) {
    return repo.fillNameIfEmpty(tenantId, existing.id, firstName);
  }
  return existing;
}

export function createFindOrCreateClient(repo: ClientRepository) {
  return async function findOrCreateClient(input: {
    actor: ClientsActor;
    phone: string;
    firstName: string | null;
    acceptExisting?: boolean;
  }): Promise<ClientRecord> {
    assertPermission(input.actor.role, "clients.write");
    const phone = normalizePhone(input.phone);
    if (!phone) {
      throw new ClientsError("VALIDATION", "PHONE_INVALID", "phone");
    }
    const firstName = assertOptionalClientName(input.firstName);
    const acceptExisting = input.acceptExisting === true;

    const existing = await repo.findByPhone(input.actor.tenantId, phone);
    if (existing) {
      return resolveExisting(repo, input.actor.tenantId, existing, firstName, acceptExisting);
    }

    try {
      return await repo.create({
        tenantId: input.actor.tenantId,
        phone,
        firstName,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "PHONE_TAKEN") {
        const raced = await repo.findByPhone(input.actor.tenantId, phone);
        if (raced) {
          return resolveExisting(repo, input.actor.tenantId, raced, firstName, acceptExisting);
        }
      }
      throw error;
    }
  };
}
