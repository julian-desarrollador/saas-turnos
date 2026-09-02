import { assertPermission } from "@/core/authorization";

import {
  assertName,
  assertNonNegativeAmount,
  assertOptionalTime,
  assertPositiveDuration,
  assertTimeRange,
} from "../catalog-rules";
import { notFound } from "../errors";
import type {
  CatalogActor,
  CatalogRepositories,
  ServiceRecord,
  UpdateServiceData,
} from "../ports/catalog-repository";

export function createListServices(repos: CatalogRepositories) {
  return async function listServices(actor: CatalogActor): Promise<ServiceRecord[]> {
    assertPermission(actor.role, "catalog.read");
    return repos.services.listByTenant(actor.tenantId);
  };
}

export function createCreateService(repos: CatalogRepositories) {
  return async function createService(input: {
    actor: CatalogActor;
    name: string;
    durationMinutes: number;
    priceAmount: number;
    prepMinutes: number;
    cleanupMinutes: number;
    earliestStart: string | null;
    latestStart: string | null;
    requiresDeposit: boolean;
  }): Promise<ServiceRecord> {
    assertPermission(input.actor.role, "catalog.write");
    const data = assertServiceFields(input);
    return repos.services.create({
      tenantId: input.actor.tenantId,
      ...data,
    });
  };
}

export function createUpdateService(repos: CatalogRepositories) {
  return async function updateService(input: {
    actor: CatalogActor;
    serviceId: string;
    name?: string;
    durationMinutes?: number;
    priceAmount?: number;
    prepMinutes?: number;
    cleanupMinutes?: number;
    earliestStart?: string | null;
    latestStart?: string | null;
    requiresDeposit?: boolean;
    isActive?: boolean;
  }): Promise<ServiceRecord> {
    assertPermission(input.actor.role, "catalog.write");

    const current = await repos.services.findById(input.actor.tenantId, input.serviceId);
    if (!current) {
      notFound();
    }

    const merged = {
      name: input.name ?? current.name,
      durationMinutes: input.durationMinutes ?? current.durationMinutes,
      priceAmount: input.priceAmount ?? current.priceAmount,
      prepMinutes: input.prepMinutes ?? current.prepMinutes,
      cleanupMinutes: input.cleanupMinutes ?? current.cleanupMinutes,
      earliestStart:
        input.earliestStart !== undefined ? input.earliestStart : current.earliestStart,
      latestStart: input.latestStart !== undefined ? input.latestStart : current.latestStart,
      requiresDeposit: input.requiresDeposit ?? current.requiresDeposit,
    };
    const data: UpdateServiceData = {
      ...assertServiceFields(merged),
    };
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const updated = await repos.services.update(input.actor.tenantId, input.serviceId, data);
    if (!updated) {
      notFound();
    }
    return updated;
  };
}

function assertServiceFields(input: {
  name: string;
  durationMinutes: number;
  priceAmount: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  requiresDeposit: boolean;
}) {
  const name = assertName(input.name, "name");
  assertPositiveDuration(input.durationMinutes);
  assertNonNegativeAmount(input.priceAmount, "priceAmount", "PRICE_MUST_BE_NON_NEGATIVE");
  assertNonNegativeAmount(input.prepMinutes, "prepMinutes", "PREP_MUST_BE_NON_NEGATIVE");
  assertNonNegativeAmount(input.cleanupMinutes, "cleanupMinutes", "CLEANUP_MUST_BE_NON_NEGATIVE");
  const earliestStart = assertOptionalTime(input.earliestStart, "earliestStart");
  const latestStart = assertOptionalTime(input.latestStart, "latestStart");
  assertTimeRange(earliestStart, latestStart);

  return {
    name,
    durationMinutes: input.durationMinutes,
    priceAmount: input.priceAmount,
    prepMinutes: input.prepMinutes,
    cleanupMinutes: input.cleanupMinutes,
    earliestStart,
    latestStart,
    requiresDeposit: input.requiresDeposit,
  };
}
