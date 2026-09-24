import { normalizeEmail } from "../email";
import { MembershipError } from "../errors";
import { isInvitableRole } from "../invitable-role";
import type {
  MemberRecord,
  MembershipInviteRecord,
  MembershipRepository,
} from "../ports/membership-repository";

export function createActivateMembershipFromOrgEvent(repo: MembershipRepository) {
  return async function activateMembershipFromOrgEvent(input: {
    clerkOrganizationId: string;
    userExternalId: string;
    email: string;
    clerkInvitationId?: string | null;
  }): Promise<MemberRecord | null> {
    const tenant = await repo.findTenantByClerkOrganizationId(input.clerkOrganizationId);
    if (!tenant) {
      return null;
    }

    const email = normalizeEmail(input.email);
    if (!email) {
      return null;
    }

    let user = await repo.findUserByExternalId(input.userExternalId);
    if (!user) {
      user = await repo.findUserByEmail(email);
    }
    if (!user) {
      return null;
    }

    const invite = await findPendingInvite(repo, tenant.id, email, input.clerkInvitationId);

    const existing = await repo.findMembership(tenant.id, user.id);
    if (existing) {
      if (invite) {
        await repo.markInviteAccepted(tenant.id, invite.id);
      }
      return existing;
    }

    if (!invite) {
      return null;
    }
    if (!isInvitableRole(invite.role)) {
      throw new MembershipError("VALIDATION", "ROLE_NOT_INVITABLE", "role");
    }

    const membership = await repo.createMembership({
      tenantId: tenant.id,
      userId: user.id,
      role: invite.role,
    });
    await repo.markInviteAccepted(tenant.id, invite.id);
    return membership;
  };
}

async function findPendingInvite(
  repo: MembershipRepository,
  tenantId: string,
  email: string,
  clerkInvitationId?: string | null,
): Promise<MembershipInviteRecord | null> {
  let invite = clerkInvitationId
    ? await repo.findPendingInviteByClerkInvitationId(tenantId, clerkInvitationId)
    : null;
  if (!invite) {
    invite = await repo.findPendingInviteByEmail(tenantId, email);
  }
  if (!invite || invite.tenantId !== tenantId) {
    return null;
  }
  return invite;
}
