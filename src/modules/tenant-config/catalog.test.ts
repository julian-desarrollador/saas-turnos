import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { createMemoryCatalog } from "@/modules/tenant-config/adapters/outbound/memory-catalog-repository";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import {
  createCreateProfessional,
  createUpdateProfessional,
} from "@/modules/tenant-config/application/use-cases/professionals";
import { createCreateService } from "@/modules/tenant-config/application/use-cases/services";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const branchA = "11111111-1111-1111-1111-111111111111";
const professionalB = "22222222-2222-2222-2222-222222222222";

const ownerA = { tenantId: tenantA, role: "OWNER" as const };
const receptionA = { tenantId: tenantA, role: "RECEPTION" as const };

function repos() {
  return createMemoryCatalog({
    branches: [{ id: branchA, tenantId: tenantA, name: "Sede principal" }],
    professionals: [
      {
        id: professionalB,
        tenantId: tenantB,
        branchId: "33333333-3333-3333-3333-333333333333",
        displayName: "De otro negocio",
        color: null,
        isActive: true,
        serviceIds: [],
      },
    ],
  });
}

describe("createService", () => {
  it("rechaza duración o precio inválidos sin persistir", async () => {
    const catalog = repos();
    const createService = createCreateService(catalog);

    await assert.rejects(
      () =>
        createService({
          actor: ownerA,
          name: "Corte",
          durationMinutes: 0,
          priceAmount: 8000,
          prepMinutes: 0,
          cleanupMinutes: 0,
          earliestStart: null,
          latestStart: null,
          requiresDeposit: false,
        }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "DURATION_MUST_BE_POSITIVE",
    );

    await assert.rejects(
      () =>
        createService({
          actor: ownerA,
          name: "Corte",
          durationMinutes: 45,
          priceAmount: -1,
          prepMinutes: 0,
          cleanupMinutes: 0,
          earliestStart: null,
          latestStart: null,
          requiresDeposit: false,
        }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "PRICE_MUST_BE_NON_NEGATIVE",
    );

    assert.equal((await catalog.services.listByTenant(tenantA)).length, 0);
  });

  it("no deja crear servicios a un rol RECEPTION", async () => {
    const createService = createCreateService(repos());

    await assert.rejects(
      () =>
        createService({
          actor: receptionA,
          name: "Corte",
          durationMinutes: 45,
          priceAmount: 8000,
          prepMinutes: 0,
          cleanupMinutes: 0,
          earliestStart: null,
          latestStart: null,
          requiresDeposit: false,
        }),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });
});

describe("updateProfessional", () => {
  it("no actualiza un profesional de otro tenant aunque el id venga en el input", async () => {
    const catalog = repos();
    const updateProfessional = createUpdateProfessional(catalog);

    await assert.rejects(
      () =>
        updateProfessional({
          actor: ownerA,
          professionalId: professionalB,
          displayName: "Intruso",
        }),
      (error: unknown) => error instanceof TenantConfigError && error.code === "NOT_FOUND",
    );

    const untouched = await catalog.professionals.findById(tenantB, professionalB);
    assert.equal(untouched?.displayName, "De otro negocio");
  });
});

describe("createProfessional", () => {
  it("crea un profesional en el tenant del actor", async () => {
    const createProfessional = createCreateProfessional(repos());
    const created = await createProfessional({
      actor: ownerA,
      displayName: " Ana ",
      color: "#4F46E5",
      branchId: null,
    });

    assert.equal(created.tenantId, tenantA);
    assert.equal(created.displayName, "Ana");
    assert.equal(created.branchId, branchA);
  });
});

describe("createService success path", () => {
  it("persiste un servicio válido", async () => {
    const catalog = repos();
    const createService = createCreateService(catalog);
    const created = await createService({
      actor: ownerA,
      name: "Corte",
      durationMinutes: 45,
      priceAmount: 8000,
      prepMinutes: 0,
      cleanupMinutes: 0,
      earliestStart: "09:00",
      latestStart: "18:00",
      requiresDeposit: false,
    });

    assert.equal(created.name, "Corte");
    const listed = await catalog.services.listByTenant(tenantA);
    assert.equal(listed.length, 1);
  });
});
