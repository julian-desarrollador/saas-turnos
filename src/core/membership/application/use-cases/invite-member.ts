import { assertPermission } from "@/core/authorization";

import { normalizeEmail } from "../email";
import { MembershipError } from "../errors";
import { isInvitableRole } from "../invitable-role";
import type { ClerkOrganizationGateway } from "../ports/clerk-organization-gateway";
import type {
  MembershipActor,
  MembershipInviteRecord,
  MembershipRepository,
} from "../ports/membership-repository";

export function createInviteMember(
  repo: MembershipRepository,
  clerk: ClerkOrganizationGateway,
  appBaseUrl: string,
) {
  return async function inviteMember(input: {
    actor: MembershipActor;
    email: string;
    role: string;
  }): Promise<MembershipInviteRecord> {
    assertPermission(input.actor.role, "members.invite");

    const email = normalizeEmail(input.email);
    if (!email) {
      throw new MembershipError("VALIDATION", "EMAIL_INVALID", "email");
    }
    if (!isInvitableRole(input.role)) {
      throw new MembershipError("VALIDATION", "ROLE_NOT_INVITABLE", "role");
    }

    const tenant = await repo.getTenant(input.actor.tenantId);
    if (!tenant) {
      throw new MembershipError("NOT_FOUND");
    }

    const existingMember = await repo.findMemberByEmail(tenant.id, email);
    if (existingMember?.isActive) {
      throw new MembershipError("CONFLICT", "ALREADY_MEMBER", "email");
    }

    const pending = await repo.findPendingInviteByEmail(tenant.id, email);
    if (pending) {
      throw new MembershipError("CONFLICT", "INVITE_ALREADY_PENDING", "email");
    }

    let organizationId = tenant.clerkOrganizationId;
    let invitation: { id: string };
    try {
      if (!organizationId) {
        const org = await clerk.createOrganization({
          name: tenant.name,
          createdByExternalId: input.actor.externalId,
          slug: `t-${tenant.id.replaceAll("-", "").slice(0, 16)}`,
        });
        organizationId = org.id;
        await repo.setTenantOrganization(tenant.id, organizationId);
      } else {
        await clerk.ensureOrganizationAdmin({
          organizationId,
          userExternalId: input.actor.externalId,
        });
      }

      const redirectUrl = `${appBaseUrl.replace(/\/$/, "")}/${tenant.slug}/agenda`;
      invitation = await clerk.createInvitation({
        organizationId,
        email,
        inviterExternalId: input.actor.externalId,
        redirectUrl,
        publicMetadata: { appRole: input.role },
      });
    } catch (error) {
      if (error instanceof MembershipError) {
        throw error;
      }
      throw new MembershipError("EXTERNAL", "CLERK_FAILED");
    }

    return repo.createInvite({
      tenantId: tenant.id,
      email,
      role: input.role,
      invitedByUserId: input.actor.userId,
      clerkInvitationId: invitation.id,
    });
  };
}
