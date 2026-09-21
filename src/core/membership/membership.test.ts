import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { createMemoryClerkGateway } from "@/core/membership/adapters/outbound/memory-clerk-gateway";
import { createMemoryMembershipRepository } from "@/core/membership/adapters/outbound/memory-membership-repository";
import { MembershipError } from "@/core/membership/application/errors";
import { createActivateMembershipFromOrgEvent } from "@/core/membership/application/use-cases/activate-membership";
import { createInviteMember } from "@/core/membership/application/use-cases/invite-member";
import { createListPendingInvites } from "@/core/membership/application/use-cases/list-members";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ownerUserId = "11111111-1111-1111-1111-111111111111";
const inviteeUserId = "22222222-2222-2222-2222-222222222222";

const ownerA = {
  tenantId: tenantA,
  userId: ownerUserId,
  externalId: "user_owner",
  role: "OWNER" as const,
};
const receptionA = {
  tenantId: tenantA,
  userId: ownerUserId,
  externalId: "user_reception",
  role: "RECEPTION" as const,
};

function emptyClerkCalls() {
  return {
    organizations: [] as { id: string; name: string }[],
    invitations: [] as { id: string; organizationId: string; email: string }[],
  };
}

function seedRepo(clerkOrganizationId: string | null = "org_demo") {
  return createMemoryMembershipRepository({
    tenants: [
      {
        id: tenantA,
        slug: "demo",
        name: "Peluquería Demo",
        clerkOrganizationId,
      },
      {
        id: tenantB,
        slug: "otro",
        name: "Otro",
        clerkOrganizationId: "org_other",
      },
    ],
    users: [
      {
        id: ownerUserId,
        externalId: "user_owner",
        email: "owner@demo.local",
        firstName: "Dev",
        lastName: "Owner",
      },
      {
        id: inviteeUserId,
        externalId: "user_invitee",
        email: "recepcion@demo.local",
        firstName: "Lu",
        lastName: "Recepción",
      },
    ],
    members: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        tenantId: tenantA,
        userId: ownerUserId,
        role: "OWNER",
        isActive: true,
      },
    ],
  });
}

describe("inviteMember", () => {
  it("crea una invitación PENDING y llama a Clerk", async () => {
    const calls = emptyClerkCalls();
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(calls),
      "http://localhost:9700",
    );

    const invite = await inviteMember({
      actor: ownerA,
      email: "  Recepcion@Demo.local ",
      role: "RECEPTION",
    });

    assert.equal(invite.email, "recepcion@demo.local");
    assert.equal(invite.role, "RECEPTION");
    assert.equal(invite.status, "PENDING");
    assert.equal(calls.invitations.length, 1);
    assert.equal(calls.invitations[0]?.email, "recepcion@demo.local");
  });

  it("rechaza invitar con rol OWNER", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    await assert.rejects(
      () => inviteMember({ actor: ownerA, email: "a@b.com", role: "OWNER" }),
      (error: unknown) => error instanceof MembershipError && error.reason === "ROLE_NOT_INVITABLE",
    );
  });

  it("rechaza una invitación duplicada pendiente", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    await inviteMember({ actor: ownerA, email: "nueva@demo.local", role: "ADMIN" });
    await assert.rejects(
      () => inviteMember({ actor: ownerA, email: "nueva@demo.local", role: "ADMIN" }),
      (error: unknown) =>
        error instanceof MembershipError && error.reason === "INVITE_ALREADY_PENDING",
    );
  });

  it("rechaza invitar a quien ya es miembro", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    await assert.rejects(
      () => inviteMember({ actor: ownerA, email: "owner@demo.local", role: "ADMIN" }),
      (error: unknown) => error instanceof MembershipError && error.reason === "ALREADY_MEMBER",
    );
  });

  it("no deja invitar a recepción", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    await assert.rejects(
      () => inviteMember({ actor: receptionA, email: "a@b.com", role: "ADMIN" }),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });

  it("crea la Organization si el tenant no la tiene", async () => {
    const calls = emptyClerkCalls();
    const repo = seedRepo(null);
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(calls),
      "http://localhost:9700",
    );
    await inviteMember({ actor: ownerA, email: "nueva@demo.local", role: "PROFESSIONAL" });
    assert.equal(calls.organizations.length, 1);
    const tenant = await repo.getTenant(tenantA);
    assert.equal(tenant?.clerkOrganizationId, calls.organizations[0]?.id);
  });
});

describe("activateMembershipFromOrgEvent", () => {
  it("crea la membership con el rol de la invite y es idempotente", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    const invite = await inviteMember({
      actor: ownerA,
      email: "recepcion@demo.local",
      role: "RECEPTION",
    });
    const activate = createActivateMembershipFromOrgEvent(repo);

    const first = await activate({
      clerkOrganizationId: "org_demo",
      userExternalId: "user_invitee",
      email: "recepcion@demo.local",
      clerkInvitationId: invite.clerkInvitationId,
    });
    assert.ok(first);
    assert.equal(first.role, "RECEPTION");
    assert.equal(first.userId, inviteeUserId);

    const second = await activate({
      clerkOrganizationId: "org_demo",
      userExternalId: "user_invitee",
      email: "recepcion@demo.local",
      clerkInvitationId: invite.clerkInvitationId,
    });
    assert.equal(second?.id, first.id);

    const pending = await createListPendingInvites(repo)(ownerA);
    assert.equal(pending.length, 0);
  });

  it("no activa invites de otro tenant", async () => {
    const repo = seedRepo();
    const inviteMember = createInviteMember(
      repo,
      createMemoryClerkGateway(emptyClerkCalls()),
      "http://localhost:9700",
    );
    await inviteMember({
      actor: ownerA,
      email: "recepcion@demo.local",
      role: "RECEPTION",
    });
    const activate = createActivateMembershipFromOrgEvent(repo);
    const result = await activate({
      clerkOrganizationId: "org_other",
      userExternalId: "user_invitee",
      email: "recepcion@demo.local",
    });
    assert.equal(result, null);
    const pending = await createListPendingInvites(repo)(ownerA);
    assert.equal(pending.length, 1);
  });
});

describe("listPendingInvites", () => {
  it("no revela invitaciones de otro tenant", async () => {
    const repo = createMemoryMembershipRepository({
      tenants: [
        {
          id: tenantA,
          slug: "demo",
          name: "Peluquería Demo",
          clerkOrganizationId: "org_demo",
        },
        {
          id: tenantB,
          slug: "otro",
          name: "Otro",
          clerkOrganizationId: "org_other",
        },
      ],
      users: [
        {
          id: ownerUserId,
          externalId: "user_owner",
          email: "owner@demo.local",
          firstName: "Dev",
          lastName: "Owner",
        },
      ],
      members: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          tenantId: tenantA,
          userId: ownerUserId,
          role: "OWNER",
          isActive: true,
        },
      ],
      invites: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          tenantId: tenantB,
          email: "secreto@otro.local",
          role: "ADMIN",
          status: "PENDING",
          clerkInvitationId: "inv_other",
          invitedByUserId: ownerUserId,
        },
        {
          id: "55555555-5555-5555-5555-555555555555",
          tenantId: tenantA,
          email: "nueva@demo.local",
          role: "RECEPTION",
          status: "PENDING",
          clerkInvitationId: "inv_demo",
          invitedByUserId: ownerUserId,
        },
      ],
    });

    const listed = await createListPendingInvites(repo)(ownerA);
    assert.deepEqual(
      listed.map((invite) => invite.email),
      ["nueva@demo.local"],
    );
  });

  it("no deja listar a recepción", async () => {
    const repo = seedRepo();
    await assert.rejects(
      () => createListPendingInvites(repo)(receptionA),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });
});
