import { assertPermission } from "@/core/authorization";

import { normalizePhone } from "../../domain/phone";
import { assertOptionalClientName } from "../client-name";
import { ClientsError } from "../errors";
import type { ClientRecord, ClientRepository, ClientsActor } from "../ports/client-repository";

export function createFindOrCreateClient(repo: ClientRepository) {
  return async function findOrCreateClient(input: {
    actor: ClientsActor;
    phone: string;
    firstName: string | null;
  }): Promise<ClientRecord> {
    assertPermission(input.actor.role, "clients.write");
    const phone = normalizePhone(input.phone);
    if (!phone) {
      throw new ClientsError("VALIDATION", "PHONE_INVALID", "phone");
    }
    const firstName = assertOptionalClientName(input.firstName);

    const existing = await repo.findByPhone(input.actor.tenantId, phone);
    if (existing) {
      if (firstName && !existing.firstName) {
        return repo.fillNameIfEmpty(input.actor.tenantId, existing.id, firstName);
      }
      return existing;
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
          return raced;
        }
      }
      throw error;
    }
  };
}
