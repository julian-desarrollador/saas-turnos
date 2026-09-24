import { randomUUID } from "node:crypto";

import type {
  InvitableRole,
  MemberRecord,
  MembershipInviteRecord,
  MembershipRepository,
  TenantOrgRecord,
} from "@/core/membership/application/ports/membership-repository";

type StoredUser = {
  id: string;
  externalId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type StoredMember = {
  id: string;
  tenantId: string;
  userId: string;
  role: MemberRecord["role"];
  isActive: boolean;
};

export function createMemoryMembershipRepository(seed?: {
  tenants?: TenantOrgRecord[];
  users?: StoredUser[];
  members?: StoredMember[];
  invites?: MembershipInviteRecord[];
}): MembershipRepository {
  const tenants = new Map((seed?.tenants ?? []).map((row) => [row.id, { ...row }]));
  const users = new Map((seed?.users ?? []).map((row) => [row.id, { ...row }]));
  const members = new Map((seed?.members ?? []).map((row) => [row.id, { ...row }]));
  const invites = new Map((seed?.invites ?? []).map((row) => [row.id, { ...row }]));

  function toMemberRecord(row: StoredMember): MemberRecord | null {
    const user = users.get(row.userId);
    if (!user) {
      return null;
    }
    return {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      role: row.role,
      isActive: row.isActive,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  return {
    async getTenant(tenantId) {
      const row = tenants.get(tenantId);
      return row ? { ...row } : null;
    },
    async setTenantOrganization(tenantId, clerkOrganizationId) {
      const row = tenants.get(tenantId);
      if (!row) {
        throw new Error("TENANT_NOT_FOUND");
      }
      row.clerkOrganizationId = clerkOrganizationId;
    },
    async listMembers(tenantId) {
      return [...members.values()]
        .filter((row) => row.tenantId === tenantId && row.isActive)
        .map((row) => toMemberRecord(row))
        .filter((row): row is MemberRecord => row !== null)
        .sort((left, right) => left.email.localeCompare(right.email, "es"));
    },
    async listPendingInvites(tenantId) {
      return [...invites.values()]
        .filter((row) => row.tenantId === tenantId && row.status === "PENDING")
        .map((row) => ({ ...row }))
        .sort((left, right) => left.email.localeCompare(right.email, "es"));
    },
    async findPendingInviteByEmail(tenantId, email) {
      const row = [...invites.values()].find(
        (item) => item.tenantId === tenantId && item.email === email && item.status === "PENDING",
      );
      return row ? { ...row } : null;
    },
    async findPendingInviteByClerkInvitationId(tenantId, clerkInvitationId) {
      const row = [...invites.values()].find(
        (item) =>
          item.tenantId === tenantId &&
          item.clerkInvitationId === clerkInvitationId &&
          item.status === "PENDING",
      );
      return row ? { ...row } : null;
    },
    async findMemberByEmail(tenantId, email) {
      const user = [...users.values()].find((item) => item.email === email);
      if (!user) {
        return null;
      }
      const row = [...members.values()].find(
        (item) => item.tenantId === tenantId && item.userId === user.id,
      );
      return row ? toMemberRecord(row) : null;
    },
    async findTenantByClerkOrganizationId(clerkOrganizationId) {
      const row = [...tenants.values()].find(
        (item) => item.clerkOrganizationId === clerkOrganizationId,
      );
      return row ? { ...row } : null;
    },
    async findUserByExternalId(externalId) {
      const row = [...users.values()].find((item) => item.externalId === externalId);
      return row ? { id: row.id, email: row.email } : null;
    },
    async findUserByEmail(email) {
      const row = [...users.values()].find((item) => item.email === email);
      return row ? { id: row.id, email: row.email, externalId: row.externalId } : null;
    },
    async createInvite(data) {
      const row: MembershipInviteRecord = {
        id: randomUUID(),
        tenantId: data.tenantId,
        email: data.email,
        role: data.role,
        status: "PENDING",
        clerkInvitationId: data.clerkInvitationId,
        invitedByUserId: data.invitedByUserId,
      };
      invites.set(row.id, row);
      return { ...row };
    },
    async markInviteAccepted(tenantId, inviteId) {
      const row = invites.get(inviteId);
      if (!row || row.tenantId !== tenantId) {
        throw new Error("INVITE_NOT_FOUND");
      }
      row.status = "ACCEPTED";
    },
    async createMembership(data) {
      const row: StoredMember = {
        id: randomUUID(),
        tenantId: data.tenantId,
        userId: data.userId,
        role: data.role as InvitableRole,
        isActive: true,
      };
      members.set(row.id, row);
      const record = toMemberRecord(row);
      if (!record) {
        throw new Error("USER_NOT_FOUND");
      }
      return record;
    },
    async findMembership(tenantId, userId) {
      const row = [...members.values()].find(
        (item) => item.tenantId === tenantId && item.userId === userId,
      );
      return row ? toMemberRecord(row) : null;
    },
  };
}
