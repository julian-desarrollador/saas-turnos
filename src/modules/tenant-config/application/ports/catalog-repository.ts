import type { Role } from "@/core/authorization";

export type CatalogActor = {
  tenantId: string;
  role: Role;
};

export type BranchRecord = {
  id: string;
  name: string;
};

export type ProfessionalRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  displayName: string;
  color: string | null;
  isActive: boolean;
  serviceIds: string[];
};

export type ServiceRecord = {
  id: string;
  tenantId: string;
  name: string;
  durationMinutes: number;
  priceAmount: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  requiresDeposit: boolean;
  isActive: boolean;
};

export type CreateProfessionalData = {
  tenantId: string;
  branchId: string;
  displayName: string;
  color: string | null;
};

export type UpdateProfessionalData = {
  displayName?: string;
  color?: string | null;
  isActive?: boolean;
};

export type CreateServiceData = {
  tenantId: string;
  name: string;
  durationMinutes: number;
  priceAmount: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  requiresDeposit: boolean;
};

export type UpdateServiceData = {
  name?: string;
  durationMinutes?: number;
  priceAmount?: number;
  prepMinutes?: number;
  cleanupMinutes?: number;
  earliestStart?: string | null;
  latestStart?: string | null;
  requiresDeposit?: boolean;
  isActive?: boolean;
};

export type BranchRepository = {
  listByTenant(tenantId: string): Promise<BranchRecord[]>;
  findById(tenantId: string, id: string): Promise<BranchRecord | null>;
};

export type ProfessionalRepository = {
  listByTenant(tenantId: string): Promise<ProfessionalRecord[]>;
  findById(tenantId: string, id: string): Promise<ProfessionalRecord | null>;
  create(data: CreateProfessionalData): Promise<ProfessionalRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateProfessionalData,
  ): Promise<ProfessionalRecord | null>;
  setServices(
    tenantId: string,
    professionalId: string,
    serviceIds: string[],
  ): Promise<ProfessionalRecord | null>;
};

export type ServiceRepository = {
  listByTenant(tenantId: string): Promise<ServiceRecord[]>;
  findById(tenantId: string, id: string): Promise<ServiceRecord | null>;
  create(data: CreateServiceData): Promise<ServiceRecord>;
  update(tenantId: string, id: string, data: UpdateServiceData): Promise<ServiceRecord | null>;
};

export type CatalogRepositories = {
  branches: BranchRepository;
  professionals: ProfessionalRepository;
  services: ServiceRepository;
};
