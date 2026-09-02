import { randomUUID } from "node:crypto";

import type { ClerkOrganizationGateway } from "@/core/membership/application/ports/clerk-organization-gateway";

export function createMemoryClerkGateway(calls: {
  organizations: { id: string; name: string; slug: string }[];
  invitations: { id: string; organizationId: string; email: string }[];
}): ClerkOrganizationGateway {
  return {
    async createOrganization(input) {
      const id = `org_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
      calls.organizations.push({ id, name: input.name, slug: input.slug });
      return { id };
    },
    async ensureOrganizationAdmin() {
      return;
    },
    async createInvitation(input) {
      const id = `inv_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
      calls.invitations.push({
        id,
        organizationId: input.organizationId,
        email: input.email,
      });
      return { id };
    },
  };
}
