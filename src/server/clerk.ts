import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { ClerkOrganizationGateway } from "@/core/membership/application/ports/clerk-organization-gateway";

function clerkFailureDetails(error: unknown): unknown {
  if (error && typeof error === "object" && "errors" in error) {
    return (error as { errors: unknown }).errors;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

async function callClerk<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error("Clerk organizations", clerkFailureDetails(error));
    throw error;
  }
}

export function createClerkOrganizationGateway(): ClerkOrganizationGateway {
  return {
    async createOrganization(input) {
      const client = await clerkClient();
      const organization = await callClerk(() =>
        client.organizations.createOrganization({
          name: input.name,
          createdBy: input.createdByExternalId,
        }),
      );
      return { id: organization.id };
    },
    async ensureOrganizationAdmin(input) {
      const client = await clerkClient();
      try {
        await callClerk(() =>
          client.organizations.createOrganizationMembership({
            organizationId: input.organizationId,
            userId: input.userExternalId,
            role: "org:admin",
          }),
        );
      } catch {
        await callClerk(() =>
          client.organizations.updateOrganizationMembership({
            organizationId: input.organizationId,
            userId: input.userExternalId,
            role: "org:admin",
          }),
        );
      }
    },
    async createInvitation(input) {
      const client = await clerkClient();
      const invitation = await callClerk(() =>
        client.organizations.createOrganizationInvitation({
          organizationId: input.organizationId,
          emailAddress: input.email,
          role: "org:member",
          inviterUserId: input.inviterExternalId,
          redirectUrl: input.redirectUrl,
          publicMetadata: { appRole: input.publicMetadata.appRole },
        }),
      );
      return { id: invitation.id };
    },
  };
}
