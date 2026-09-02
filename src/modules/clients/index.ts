export { createPrismaClientRepository } from "./adapters/outbound/prisma-client-repository";
export { clientsValidationMessage } from "./adapters/inbound/messages";
export {
  loadClientsPage,
  loadClientFichaPage,
  fetchClientsAction,
} from "./adapters/inbound/actions";
export type { ClientsListPayload } from "./adapters/inbound/actions";
export { ClientsError } from "./application/errors";
export { createFindOrCreateClient } from "./application/use-cases/find-or-create-client";
export type { ClientListItem } from "./application/use-cases/list-clients";
export type { ClientRecord } from "./application/ports/client-repository";
