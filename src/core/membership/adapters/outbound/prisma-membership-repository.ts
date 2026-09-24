import { isRole } from "@/core/authorization";
import { isInvitableRole } from "@/core/membership/application/invitable-role";
import type {
  MemberRecord,
  MembershipInviteRecord,
  MembershipRepository,
  TenantOrgRecord,
} from "@/core/membership/application/ports/membership-repository";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TenantDb } from "@/server/tenant-db";

const tenantSelect = {
  id: true,
  slug: true,
  name: true,
  clerkOrganizationId: true,
} as const;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  externalId: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

function toTenant(row: {
  id: string;
  slug: string;
  name: string;
  clerkOrganizationId: string | null;
}): TenantOrgRecord {
  return row;
}

function toMemberRecord(row: {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  isActive: boolean;
  user: { email: string; firstName: string | null; lastName: string | null };
}): MemberRecord | null {
  if (!isRole(row.role)) {
    return null;
  }
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    role: row.role,
    isActive: row.isActive,
    email: row.user.email,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
  };
}

function toInviteRecord(row: {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  status: string;
  clerkInvitationId: string | null;
  invitedByUserId: string;
}): MembershipInviteRecord | null {
  if (!isInvitableRole(row.role)) {
    return null;
  }
  if (row.status !== "PENDING" && row.status !== "ACCEPTED" && row.status !== "REVOKED") {
    return null;
  }
  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    role: row.role,
    status: row.status,
    clerkInvitationId: row.clerkInvitationId,
    invitedByUserId: row.invitedByUserId,
  };
}

export function createPrismaMembershipRepository(
  db: PrismaClient,
  tenantDb: TenantDb,
): MembershipRepository {
  async function memberByUser(tenantId: string, userId: string): Promise<MemberRecord | null> {
    const row = await db.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { user: { select: userSelect } },
    });
    return row ? toMemberRecord(row) : null;
  }

  return {
    async getTenant(tenantId) {
      const row = await db.tenant.findUnique({
        where: { id: tenantId },
        select: tenantSelect,
      });
      return row ? toTenant(row) : null;
    },
    async setTenantOrganization(tenantId, clerkOrganizationId) {
      await db.tenant.update({
        where: { id: tenantId },
        data: { clerkOrganizationId },
      });
    },
    async listMembers(tenantId) {
      const rows = await db.membership.findMany({
        where: { tenantId, isActive: true },
        include: { user: { select: userSelect } },
        orderBy: { user: { email: "asc" } },
      });
      return rows
        .map((row) => toMemberRecord(row))
        .filter((row): row is MemberRecord => row !== null);
    },
    async listPendingInvites(tenantId) {
      return tenantDb.run(tenantId, async (tx) => {
        const rows = await tx.membershipInvite.findMany({
          where: { tenantId, status: "PENDING" },
          orderBy: { email: "asc" },
        });
        return rows
          .map((row) => toInviteRecord(row))
          .filter((row): row is MembershipInviteRecord => row !== null);
      });
    },
    async findPendingInviteByEmail(tenantId, email) {
      return tenantDb.run(tenantId, async (tx) => {
        const row = await tx.membershipInvite.findFirst({
          where: { tenantId, email, status: "PENDING" },
        });
        return row ? toInviteRecord(row) : null;
      });
    },
    async findPendingInviteByClerkInvitationId(tenantId, clerkInvitationId) {
      return tenantDb.run(tenantId, async (tx) => {
        const row = await tx.membershipInvite.findFirst({
          where: { tenantId, clerkInvitationId, status: "PENDING" },
        });
        return row ? toInviteRecord(row) : null;
      });
    },
    async findMemberByEmail(tenantId, email) {
      const user = await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (!user) {
        return null;
      }
      return memberByUser(tenantId, user.id);
    },
    async findTenantByClerkOrganizationId(clerkOrganizationId) {
      const row = await db.tenant.findUnique({
        where: { clerkOrganizationId },
        select: tenantSelect,
      });
      return row ? toTenant(row) : null;
    },
    async findUserByExternalId(externalId) {
      const row = await db.user.findUnique({
        where: { externalId },
        select: { id: true, email: true },
      });
      return row;
    },
    async findUserByEmail(email) {
      const row = await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, email: true, externalId: true },
      });
      return row;
    },
    async createInvite(data) {
      try {
        const row = await tenantDb.run(data.tenantId, (tx) =>
          tx.membershipInvite.create({
            data: {
              tenantId: data.tenantId,
              email: data.email,
              role: data.role,
              status: "PENDING",
              clerkInvitationId: data.clerkInvitationId,
              invitedByUserId: data.invitedByUserId,
            },
          }),
        );
        const record = toInviteRecord(row);
        if (!record) {
          throw new Error("INVITE_ROLE_INVALID");
        }
        return record;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new Error("INVITE_ALREADY_PENDING");
        }
        throw error;
      }
    },
    async markInviteAccepted(tenantId, inviteId) {
      await tenantDb.run(tenantId, async (tx) => {
        const updated = await tx.membershipInvite.updateMany({
          where: { id: inviteId, tenantId, status: "PENDING" },
          data: { status: "ACCEPTED" },
        });
        if (updated.count !== 1) {
          throw new Error("INVITE_NOT_FOUND");
        }
      });
    },
    async createMembership(data) {
      try {
        const row = await db.membership.create({
          data: {
            tenantId: data.tenantId,
            userId: data.userId,
            role: data.role,
            isActive: true,
          },
          include: { user: { select: userSelect } },
        });
        const record = toMemberRecord(row);
        if (!record) {
          throw new Error("MEMBER_ROLE_INVALID");
        }
        return record;
      } catch (error) {
        if (isUniqueViolation(error)) {
          const existing = await memberByUser(data.tenantId, data.userId);
          if (existing) {
            return existing;
          }
        }
        throw error;
      }
    },
    async findMembership(tenantId, userId) {
      return memberByUser(tenantId, userId);
    },
  };
}
