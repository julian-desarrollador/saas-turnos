"use server";

import { hasPermission, type Role } from "@/core/authorization";
import { createPrismaClientRepository } from "@/modules/clients/adapters/outbound/prisma-client-repository";
import { ClientsError } from "@/modules/clients/application/errors";
import { CLIENT_APPOINTMENT_LIMIT, CLIENT_LIST_LIMIT } from "@/modules/clients/application/search";
import { createGetClientFicha } from "@/modules/clients/application/use-cases/get-client-ficha";
import {
  createListClients,
  type ClientListItem,
} from "@/modules/clients/application/use-cases/list-clients";
import { resolveTenantContext } from "@/server/auth";
import { db } from "@/server/db";

import { clientsValidationMessage } from "./messages";

const repo = createPrismaClientRepository(db);
const listClients = createListClients(repo);
const getClientFicha = createGetClientFicha(repo);

export type ClientsListPayload = {
  query: string;
  clients: ClientListItem[];
  hasMore: boolean;
  listLimit: number;
  error?: string;
};

function actorFrom(ctx: { tenant: { id: string }; membership: { role: Role } }) {
  return { tenantId: ctx.tenant.id, role: ctx.membership.role };
}

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

async function actorForSlug(slug: string) {
  const ctx = await resolveTenantContext(slug);
  return { ctx, actor: actorFrom(ctx) };
}

async function listClientsPayload(
  actor: { tenantId: string; role: Role },
  search: string,
): Promise<ClientsListPayload> {
  try {
    const listed = await listClients({ actor, query: search });
    return {
      query: search,
      clients: listed.clients,
      hasMore: listed.hasMore,
      listLimit: CLIENT_LIST_LIMIT,
    };
  } catch (error) {
    if (error instanceof ClientsError && error.code === "VALIDATION") {
      return {
        query: search,
        clients: [],
        hasMore: false,
        listLimit: CLIENT_LIST_LIMIT,
        error: clientsValidationMessage(error.reason),
      };
    }
    throw error;
  }
}

export async function loadClientsPage(slug: string, query: { q?: string | string[] }) {
  const { ctx, actor } = await actorForSlug(slug);
  const search = readQueryValue(query.q).trim();
  const listed = await listClientsPayload(actor, search);
  return {
    slug,
    tenantName: ctx.tenant.name,
    ...listed,
  };
}

export async function fetchClientsAction(slug: string, query: string): Promise<ClientsListPayload> {
  const { actor } = await actorForSlug(slug);
  return listClientsPayload(actor, query.trim());
}

export async function loadClientFichaPage(slug: string, clientId: string) {
  const { ctx, actor } = await actorForSlug(slug);
  const ficha = await getClientFicha({ actor, clientId });
  return {
    slug,
    tenantName: ctx.tenant.name,
    appointmentLimit: CLIENT_APPOINTMENT_LIMIT,
    canWrite: hasPermission(actor.role, "clients.write"),
    ...ficha,
  };
}
