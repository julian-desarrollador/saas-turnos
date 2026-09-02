import { assertPermission } from "@/core/authorization";

import { notFound } from "../errors";
import type {
  ClientAppointmentRecord,
  ClientFicha,
  ClientRepository,
  ClientsActor,
} from "../ports/client-repository";
import { CLIENT_APPOINTMENT_LIMIT, isClientId } from "../search";

export type ClientFichaResult = {
  client: ClientFicha;
  appointments: ClientAppointmentRecord[];
  hasMoreAppointments: boolean;
};

export function createGetClientFicha(repo: ClientRepository) {
  return async function getClientFicha(input: {
    actor: ClientsActor;
    clientId: string;
  }): Promise<ClientFichaResult> {
    assertPermission(input.actor.role, "clients.read");
    if (!isClientId(input.clientId)) {
      notFound();
    }

    const client = await repo.findById(input.actor.tenantId, input.clientId);
    if (!client) {
      notFound();
    }

    const rows = await repo.listAppointments(
      input.actor.tenantId,
      client.id,
      CLIENT_APPOINTMENT_LIMIT + 1,
    );
    const hasMoreAppointments = rows.length > CLIENT_APPOINTMENT_LIMIT;
    return {
      client,
      appointments: hasMoreAppointments ? rows.slice(0, CLIENT_APPOINTMENT_LIMIT) : rows,
      hasMoreAppointments,
    };
  };
}
