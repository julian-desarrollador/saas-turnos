import { assertPermission } from "@/core/authorization";

import { TenantConfigError, notFound } from "../errors";
import type {
  CatalogActor,
  CatalogRepositories,
  ProfessionalRecord,
  UpdateProfessionalData,
} from "../ports/catalog-repository";
import { assertName, assertOptionalColor } from "../catalog-rules";

export function createListProfessionals(repos: CatalogRepositories) {
  return async function listProfessionals(actor: CatalogActor): Promise<ProfessionalRecord[]> {
    assertPermission(actor.role, "catalog.read");
    return repos.professionals.listByTenant(actor.tenantId);
  };
}

export function createCreateProfessional(repos: CatalogRepositories) {
  return async function createProfessional(input: {
    actor: CatalogActor;
    displayName: string;
    color: string | null;
    branchId: string | null;
  }): Promise<ProfessionalRecord> {
    assertPermission(input.actor.role, "catalog.write");

    const displayName = assertName(input.displayName, "displayName");
    const color = assertOptionalColor(input.color);
    const branchId = await resolveBranchId(repos, input.actor.tenantId, input.branchId);

    return repos.professionals.create({
      tenantId: input.actor.tenantId,
      branchId,
      displayName,
      color,
    });
  };
}

export function createUpdateProfessional(repos: CatalogRepositories) {
  return async function updateProfessional(input: {
    actor: CatalogActor;
    professionalId: string;
    displayName?: string;
    color?: string | null;
    isActive?: boolean;
  }): Promise<ProfessionalRecord> {
    assertPermission(input.actor.role, "catalog.write");

    const data: UpdateProfessionalData = {};
    if (input.displayName !== undefined) {
      data.displayName = assertName(input.displayName, "displayName");
    }
    if (input.color !== undefined) {
      data.color = assertOptionalColor(input.color);
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const updated = await repos.professionals.update(
      input.actor.tenantId,
      input.professionalId,
      data,
    );
    if (!updated) {
      notFound();
    }
    return updated;
  };
}

export function createSetProfessionalServices(repos: CatalogRepositories) {
  return async function setProfessionalServices(input: {
    actor: CatalogActor;
    professionalId: string;
    serviceIds: string[];
  }): Promise<ProfessionalRecord> {
    assertPermission(input.actor.role, "catalog.write");

    const uniqueIds = [...new Set(input.serviceIds)];
    if (uniqueIds.length > 0) {
      const tenantServices = await repos.services.listByTenant(input.actor.tenantId);
      const allowed = new Set(tenantServices.map((service) => service.id));
      if (uniqueIds.some((id) => !allowed.has(id))) {
        throw new TenantConfigError("VALIDATION", "SERVICES_NOT_IN_TENANT", "serviceIds");
      }
    }

    const updated = await repos.professionals.setServices(
      input.actor.tenantId,
      input.professionalId,
      uniqueIds,
    );
    if (!updated) {
      notFound();
    }
    return updated;
  };
}

async function resolveBranchId(
  repos: CatalogRepositories,
  tenantId: string,
  branchId: string | null,
): Promise<string> {
  if (branchId) {
    const branch = await repos.branches.findById(tenantId, branchId);
    if (!branch) {
      throw new TenantConfigError("VALIDATION", "BRANCH_REQUIRED", "branchId");
    }
    return branch.id;
  }

  const branches = await repos.branches.listByTenant(tenantId);
  if (branches.length !== 1 || !branches[0]) {
    throw new TenantConfigError("VALIDATION", "BRANCH_REQUIRED", "branchId");
  }
  return branches[0].id;
}
