import { assertPermission } from "@/core/authorization";

import { ClientsError } from "../errors";
import type { ClientRecord, ClientRepository, ClientsActor } from "../ports/client-repository";
import { CLIENT_LIST_LIMIT, CLIENT_QUERY_MAX, parseClientSearch } from "../search";

export type ClientListItem = ClientRecord & {
  visitCount: number;
  lastVisitLocalDate: string | null;
};

export type ClientListResult = {
  clients: ClientListItem[];
  hasMore: boolean;
};

export function createListClients(repo: ClientRepository) {
  return async function listClients(input: {
    actor: ClientsActor;
    query: string;
  }): Promise<ClientListResult> {
    assertPermission(input.actor.role, "clients.read");
    if (input.query.length > CLIENT_QUERY_MAX) {
      throw new ClientsError("VALIDATION", "QUERY_TOO_LONG", "query");
    }

    const terms = parseClientSearch(input.query);
    const rows = await repo.listByTenant(input.actor.tenantId, terms, CLIENT_LIST_LIMIT + 1);
    const hasMore = rows.length > CLIENT_LIST_LIMIT;
    const page = hasMore ? rows.slice(0, CLIENT_LIST_LIMIT) : rows;
    const summaries = await repo.listVisitSummaries(
      input.actor.tenantId,
      page.map((row) => row.id),
    );
    const byClientId = new Map(summaries.map((row) => [row.clientId, row]));

    return {
      clients: page.map((row) => {
        const summary = byClientId.get(row.id);
        return {
          ...row,
          visitCount: summary?.visitCount ?? 0,
          lastVisitLocalDate: summary?.lastVisitLocalDate ?? null,
        };
      }),
      hasMore,
    };
  };
}
