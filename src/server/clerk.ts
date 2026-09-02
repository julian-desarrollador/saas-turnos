import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { ClerkOrganizationGateway } from "@/core/membership/application/ports/clerk-organization-gateway";

export function createClerkOrganizationGateway(): ClerkOrganizationGateway {
  return {
    async createOrganization(input) {
      const client = await clerkClient();
      const organization = await client.organizations.createOrganization({
        name: input.name,
        createdBy: input.createdByExternalId,
        slug: input.slug,
      });
      return { id: organization.id };
    },
    async ensureOrganizationAdmin(input) {
      const client = await clerkClient();
      try {
        await client.organizations.createOrganizationMembership({
          organizationId: input.organizationId,
          userId: input.userExternalId,
          role: "org:admin",
        });
      } catch {
        await client.organizations.updateOrganizationMembership({
          organizationId: input.organizationId,
          userId: input.userExternalId,
          role: "org:admin",
        });
      }
    },
    async createInvitation(input) {
      const client = await clerkClient();
      const invitation = await client.organizations.createOrganizationInvitation({
        organizationId: input.organizationId,
        emailAddress: input.email,
        role: "org:member",
        inviterUserId: input.inviterExternalId,
        redirectUrl: input.redirectUrl,
        publicMetadata: { appRole: input.publicMetadata.appRole },
      });
      return { id: invitation.id };
    },
  };
}
