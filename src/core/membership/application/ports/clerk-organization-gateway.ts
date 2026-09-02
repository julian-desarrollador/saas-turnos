export type ClerkOrganizationGateway = {
  createOrganization(input: {
    name: string;
    createdByExternalId: string;
    slug: string;
  }): Promise<{ id: string }>;
  ensureOrganizationAdmin(input: { organizationId: string; userExternalId: string }): Promise<void>;
  createInvitation(input: {
    organizationId: string;
    email: string;
    inviterExternalId: string;
    redirectUrl: string;
    publicMetadata: { appRole: string };
  }): Promise<{ id: string }>;
};
