import { randomUUID } from "node:crypto";

import type {
  CatalogRepositories,
  CreateProfessionalData,
  CreateServiceData,
  ProfessionalRecord,
  ServiceRecord,
  UpdateProfessionalData,
  UpdateServiceData,
} from "@/modules/tenant-config/application/ports/catalog-repository";

function cloneProfessional(row: ProfessionalRecord): ProfessionalRecord {
  return { ...row, serviceIds: [...row.serviceIds] };
}

function cloneService(row: ServiceRecord): ServiceRecord {
  return { ...row };
}

export function createMemoryCatalog(seed?: {
  branches?: { id: string; tenantId: string; name: string }[];
  professionals?: ProfessionalRecord[];
  services?: ServiceRecord[];
}): CatalogRepositories {
  const branches = new Map((seed?.branches ?? []).map((branch) => [branch.id, { ...branch }]));
  const professionals = new Map(
    (seed?.professionals ?? []).map((row) => [row.id, cloneProfessional(row)]),
  );
  const services = new Map((seed?.services ?? []).map((row) => [row.id, cloneService(row)]));

  return {
    branches: {
      async listByTenant(tenantId) {
        return [...branches.values()]
          .filter((branch) => branch.tenantId === tenantId)
          .map(({ id, name }) => ({ id, name }));
      },
      async findById(tenantId, id) {
        const branch = branches.get(id);
        if (!branch || branch.tenantId !== tenantId) {
          return null;
        }
        return { id: branch.id, name: branch.name };
      },
    },
    professionals: {
      async listByTenant(tenantId) {
        return [...professionals.values()]
          .filter((row) => row.tenantId === tenantId)
          .map(cloneProfessional);
      },
      async findById(tenantId, id) {
        const row = professionals.get(id);
        if (!row || row.tenantId !== tenantId) {
          return null;
        }
        return cloneProfessional(row);
      },
      async create(data: CreateProfessionalData) {
        const row: ProfessionalRecord = {
          id: randomUUID(),
          tenantId: data.tenantId,
          branchId: data.branchId,
          displayName: data.displayName,
          color: data.color,
          isActive: true,
          serviceIds: [],
        };
        professionals.set(row.id, row);
        return cloneProfessional(row);
      },
      async update(tenantId, id, data: UpdateProfessionalData) {
        const row = professionals.get(id);
        if (!row || row.tenantId !== tenantId) {
          return null;
        }
        const next = { ...row, ...data, serviceIds: [...row.serviceIds] };
        professionals.set(id, next);
        return cloneProfessional(next);
      },
      async setServices(tenantId, professionalId, serviceIds) {
        const row = professionals.get(professionalId);
        if (!row || row.tenantId !== tenantId) {
          return null;
        }
        const next = { ...row, serviceIds: [...serviceIds] };
        professionals.set(professionalId, next);
        return cloneProfessional(next);
      },
    },
    services: {
      async listByTenant(tenantId) {
        return [...services.values()].filter((row) => row.tenantId === tenantId).map(cloneService);
      },
      async findById(tenantId, id) {
        const row = services.get(id);
        if (!row || row.tenantId !== tenantId) {
          return null;
        }
        return cloneService(row);
      },
      async create(data: CreateServiceData) {
        const row: ServiceRecord = {
          id: randomUUID(),
          isActive: true,
          ...data,
        };
        services.set(row.id, row);
        return cloneService(row);
      },
      async update(tenantId, id, data: UpdateServiceData) {
        const row = services.get(id);
        if (!row || row.tenantId !== tenantId) {
          return null;
        }
        const next = { ...row, ...data };
        services.set(id, next);
        return cloneService(next);
      },
    },
  };
}
