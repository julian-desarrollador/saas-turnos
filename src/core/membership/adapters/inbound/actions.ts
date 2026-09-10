"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ForbiddenError, hasPermission } from "@/core/authorization";
import { membershipValidationMessage } from "@/core/membership/adapters/inbound/messages";
import { createPrismaMembershipRepository } from "@/core/membership/adapters/outbound/prisma-membership-repository";
import { MembershipError } from "@/core/membership/application/errors";
import type { MembershipActor } from "@/core/membership/application/ports/membership-repository";
import { createInviteMember } from "@/core/membership/application/use-cases/invite-member";
import {
  createListMembers,
  createListPendingInvites,
} from "@/core/membership/application/use-cases/list-members";
import { clientEnv } from "@/lib/env/client";
import { resolveTenantContext, type TenantContext } from "@/server/auth";
import { createClerkOrganizationGateway } from "@/server/clerk";
import { db } from "@/server/db";

export type ActionState = {
  ok: boolean;
  message?: string;
};

function membershipApp() {
  const repo = createPrismaMembershipRepository(db);
  const clerk = createClerkOrganizationGateway();
  return {
    listMembers: createListMembers(repo),
    listPendingInvites: createListPendingInvites(repo),
    inviteMember: createInviteMember(repo, clerk, clientEnv.NEXT_PUBLIC_APP_URL),
  };
}

function actorFrom(ctx: TenantContext): MembershipActor {
  return {
    tenantId: ctx.tenant.id,
    userId: ctx.user.id,
    externalId: ctx.user.externalId,
    role: ctx.membership.role,
  };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toActionState(error: unknown): ActionState {
  if (error instanceof ForbiddenError) {
    return { ok: false, message: "No tenés permiso para esta acción." };
  }
  if (error instanceof MembershipError && error.code === "NOT_FOUND") {
    return { ok: false, message: "No encontramos ese negocio." };
  }
  if (error instanceof MembershipError) {
    return { ok: false, message: membershipValidationMessage(error.reason) };
  }
  throw error;
}

export async function loadMembersPage(slug: string) {
  const ctx = await resolveTenantContext(slug);
  const actor = actorFrom(ctx);
  if (!hasPermission(actor.role, "members.read")) {
    redirect(`/${slug}/agenda` as never);
  }

  const { listMembers, listPendingInvites } = membershipApp();
  const [members, invites] = await Promise.all([listMembers(actor), listPendingInvites(actor)]);

  return {
    tenantName: ctx.tenant.name,
    canInvite: hasPermission(actor.role, "members.invite"),
    members,
    invites,
  };
}

export async function inviteMemberAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const ctx = await resolveTenantContext(slug);
    const { inviteMember } = membershipApp();
    await inviteMember({
      actor: actorFrom(ctx),
      email: readString(formData, "email"),
      role: readString(formData, "role"),
    });
    revalidatePath(`/${slug}/members`);
    return {
      ok: true,
      message: "Invitación enviada. La persona va a recibir un correo de Clerk.",
    };
  } catch (error) {
    return toActionState(error);
  }
}
