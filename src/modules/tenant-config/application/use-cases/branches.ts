import { assertPermission } from "@/core/authorization";

import type { BranchRecord, CatalogActor, CatalogRepositories } from "../ports/catalog-repository";

export function createListBranches(repos: CatalogRepositories) {
  return async function listBranches(actor: CatalogActor): Promise<BranchRecord[]> {
    assertPermission(actor.role, "catalog.read");
    return repos.branches.listByTenant(actor.tenantId);
  };
}
