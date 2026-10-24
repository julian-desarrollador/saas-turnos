import type { PlanCode } from "@/modules/billing/domain/subscription";

export type OrganizationGateway = {
  createOrganization(input: { name: string; createdByExternalId: string }): Promise<{ id: string }>;
  deleteOrganization(organizationId: string): Promise<void>;
};

export type ProvisionBusinessInput = {
  ownerExternalId: string;
  ownerEmail: string;
  ownerFirstName: string | null;
  name: string;
  slug: string;
  timezone: string;
  plan: PlanCode;
  employeeLimit: number;
  messageMonthlyCap: number;
  trialEndsAt: Date;
  clerkOrganizationId: string;
  branchPhone: string;
};

export type BusinessProvisioner = {
  isSlugTaken(slug: string): Promise<boolean>;
  provision(input: ProvisionBusinessInput): Promise<{ tenantId: string }>;
  deleteTenant(tenantId: string): Promise<void>;
};
