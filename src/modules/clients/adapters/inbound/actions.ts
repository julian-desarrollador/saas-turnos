"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ForbiddenError, hasPermission, type Role } from "@/core/authorization";
import { createPrismaClientRepository } from "@/modules/clients/adapters/outbound/prisma-client-repository";
import { ClientsError } from "@/modules/clients/application/errors";
import { CLIENT_APPOINTMENT_LIMIT, CLIENT_LIST_LIMIT } from "@/modules/clients/application/search";
import { createGetClientFicha } from "@/modules/clients/application/use-cases/get-client-ficha";
import {
  createListClients,
  type ClientListItem,
} from "@/modules/clients/application/use-cases/list-clients";
import { createUpdateClientFicha } from "@/modules/clients/application/use-cases/update-client-ficha";
import { clientFichaHref } from "@/modules/clients/components/client-ficha-view";
import { resolveTenantContext } from "@/server/auth";
import { db } from "@/server/db";

import { clientsValidationMessage } from "./messages";

const repo = createPrismaClientRepository(db);
const listClients = createListClients(repo);
const getClientFicha = createGetClientFicha(repo);
const updateClientFicha = createUpdateClientFicha(repo);

export type ClientsListPayload = {
  query: string;
  clients: ClientListItem[];
  hasMore: boolean;
  listLimit: number;
  error?: string;
};

export type ClientFichaActionState = {
  ok: boolean;
  message?: string;
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

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalName(formData: FormData, key: string): string | null {
  const value = readString(formData, key).trim();
  return value === "" ? null : value;
}

function toFichaActionState(error: unknown): ClientFichaActionState {
  if (error instanceof ForbiddenError) {
    return { ok: false, message: "No tenés permiso para esta acción." };
  }
  if (error instanceof ClientsError && error.code === "NOT_FOUND") {
    return { ok: false, message: "No encontramos ese cliente." };
  }
  if (error instanceof ClientsError && (error.code === "VALIDATION" || error.code === "CONFLICT")) {
    return { ok: false, message: clientsValidationMessage(error.reason) };
  }
  throw error;
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

export async function saveClientFichaAction(
  _prev: ClientFichaActionState | undefined,
  formData: FormData,
): Promise<ClientFichaActionState> {
  const slug = readString(formData, "slug");
  const clientId = readString(formData, "clientId");
  const from = readString(formData, "from");
  const date = readString(formData, "date");

  try {
    const { actor } = await actorForSlug(slug);
    await updateClientFicha({
      actor,
      clientId,
      phone: readString(formData, "phone"),
      firstName: readOptionalName(formData, "firstName"),
    });
  } catch (error) {
    return toFichaActionState(error);
  }

  revalidatePath(`/${slug}/clients`);
  revalidatePath(`/${slug}/clients/${clientId}`);
  revalidatePath(`/${slug}/agenda`);
  redirect(
    clientFichaHref(slug, clientId, {
      from,
      date,
      saved: true,
    }) as never,
  );
}
