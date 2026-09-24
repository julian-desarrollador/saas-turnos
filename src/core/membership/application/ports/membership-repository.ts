import type { Role } from "@/core/authorization";

export type MembershipActor = {
  tenantId: string;
  userId: string;
  externalId: string;
  role: Role;
};

export type InvitableRole = Exclude<Role, "OWNER">;

export type MemberRecord = {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  isActive: boolean;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type MembershipInviteStatus = "PENDING" | "ACCEPTED" | "REVOKED";

export type MembershipInviteRecord = {
  id: string;
  tenantId: string;
  email: string;
  role: InvitableRole;
  status: MembershipInviteStatus;
  clerkInvitationId: string | null;
  invitedByUserId: string;
};

export type TenantOrgRecord = {
  id: string;
  slug: string;
  name: string;
  clerkOrganizationId: string | null;
};

export type MembershipRepository = {
  getTenant(tenantId: string): Promise<TenantOrgRecord | null>;
  setTenantOrganization(tenantId: string, clerkOrganizationId: string): Promise<void>;
  listMembers(tenantId: string): Promise<MemberRecord[]>;
  listPendingInvites(tenantId: string): Promise<MembershipInviteRecord[]>;
  findPendingInviteByEmail(tenantId: string, email: string): Promise<MembershipInviteRecord | null>;
  findPendingInviteByClerkInvitationId(
    tenantId: string,
    clerkInvitationId: string,
  ): Promise<MembershipInviteRecord | null>;
  findMemberByEmail(tenantId: string, email: string): Promise<MemberRecord | null>;
  findTenantByClerkOrganizationId(clerkOrganizationId: string): Promise<TenantOrgRecord | null>;
  findUserByExternalId(externalId: string): Promise<{
    id: string;
    email: string;
  } | null>;
  findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    externalId: string;
  } | null>;
  createInvite(data: {
    tenantId: string;
    email: string;
    role: InvitableRole;
    invitedByUserId: string;
    clerkInvitationId: string;
  }): Promise<MembershipInviteRecord>;
  markInviteAccepted(tenantId: string, inviteId: string): Promise<void>;
  createMembership(data: {
    tenantId: string;
    userId: string;
    role: InvitableRole;
  }): Promise<MemberRecord>;
  findMembership(tenantId: string, userId: string): Promise<MemberRecord | null>;
};
