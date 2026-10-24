import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { OrganizationGateway } from "@/modules/billing/application/ports/business-provisioner";

export function createClerkOrganizationDirectory(): OrganizationGateway {
  return {
    async createOrganization(input) {
      const client = await clerkClient();
      const organization = await client.organizations.createOrganization({
        name: input.name,
        createdBy: input.createdByExternalId,
      });
      return { id: organization.id };
    },
    async deleteOrganization(organizationId) {
      const client = await clerkClient();
      await client.organizations.deleteOrganization(organizationId);
    },
  };
}
