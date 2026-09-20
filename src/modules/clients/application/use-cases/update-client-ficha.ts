import { assertPermission } from "@/core/authorization";

import { normalizePhone } from "../../domain/phone";
import { assertOptionalClientName } from "../client-name";
import { ClientsError, notFound } from "../errors";
import type { ClientFicha, ClientRepository, ClientsActor } from "../ports/client-repository";
import { isClientId } from "../search";

export function createUpdateClientFicha(repo: ClientRepository) {
  return async function updateClientFicha(input: {
    actor: ClientsActor;
    clientId: string;
    phone: string;
    firstName: string | null;
  }): Promise<ClientFicha> {
    assertPermission(input.actor.role, "clients.write");
    if (!isClientId(input.clientId)) {
      notFound();
    }

    const client = await repo.findById(input.actor.tenantId, input.clientId);
    if (!client) {
      notFound();
    }

    const phone = normalizePhone(input.phone);
    if (!phone) {
      throw new ClientsError("VALIDATION", "PHONE_INVALID", "phone");
    }
    const firstName = assertOptionalClientName(input.firstName);

    const taken = await repo.findByPhone(input.actor.tenantId, phone);
    if (taken && taken.id !== client.id) {
      throw new ClientsError("CONFLICT", "PHONE_TAKEN", "phone");
    }

    try {
      return await repo.updateIdentity(input.actor.tenantId, client.id, { phone, firstName });
    } catch (error) {
      if (error instanceof Error && error.message === "PHONE_TAKEN") {
        throw new ClientsError("CONFLICT", "PHONE_TAKEN", "phone");
      }
      throw error;
    }
  };
}
