import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BillingError } from "@/modules/billing/application/errors";
import { createOpenTrial } from "@/modules/billing/application/use-cases/open-trial";
import type {
  BusinessProvisioner,
  OrganizationGateway,
} from "@/modules/billing/application/ports/business-provisioner";

const start = new Date("2026-09-01T12:00:00.000Z");

function harness(options?: { failProvision?: boolean }) {
  const organizations: { id: string; name: string }[] = [];
  const deletedOrganizations: string[] = [];
  const tenants: {
    id: string;
    slug: string;
    plan: string;
    trialEndsAt: Date;
    phone: string;
  }[] = [];
  let orgCount = 0;

  const gateway: OrganizationGateway = {
    async createOrganization(input) {
      orgCount += 1;
      const id = `org_${orgCount}`;
      organizations.push({ id, name: input.name });
      return { id };
    },
    async deleteOrganization(organizationId) {
      deletedOrganizations.push(organizationId);
    },
  };

  const provisioner: BusinessProvisioner = {
    async isSlugTaken(slug) {
      return tenants.some((tenant) => tenant.slug === slug);
    },
    async provision(input) {
      if (options?.failProvision) {
        throw new Error("DB_DOWN");
      }
      const id = `tenant_${tenants.length + 1}`;
      tenants.push({
        id,
        slug: input.slug,
        plan: input.plan,
        trialEndsAt: input.trialEndsAt,
        phone: input.branchPhone,
      });
      return { tenantId: id };
    },
    async deleteTenant() {
      return undefined;
    },
  };

  return {
    openTrial: createOpenTrial(provisioner, gateway),
    organizations,
    deletedOrganizations,
    tenants,
  };
}

const owner = {
  ownerExternalId: "user_ana",
  ownerEmail: "ana@negocio.test",
  ownerFirstName: "Ana",
  name: "Peluquería Ana",
  slug: "ana",
  timezone: "America/Argentina/Buenos_Aires",
  plan: "INICIO",
  phone: "1112345678",
  now: start,
};

describe("openTrial", () => {
  it("abre la prueba del plan por un mes", async () => {
    const { openTrial, tenants, organizations } = harness();
    const opened = await openTrial(owner);
    assert.equal(opened.slug, "ana");
    assert.equal(opened.trialEndsAt.toISOString(), "2026-10-01T12:00:00.000Z");
    assert.equal(tenants[0]?.plan, "INICIO");
    assert.equal(tenants[0]?.phone, "+5491112345678");
    assert.equal(organizations.length, 1);
  });

  it("no deja un negocio si Clerk falla", async () => {
    const { tenants } = harness();
    const gateway: OrganizationGateway = {
      async createOrganization() {
        throw new Error("CLERK_DOWN");
      },
      async deleteOrganization() {
        return undefined;
      },
    };
    const broken = createOpenTrial(
      {
        async isSlugTaken() {
          return false;
        },
        async provision() {
          tenants.push({
            id: "no",
            slug: "ana",
            plan: "INICIO",
            trialEndsAt: start,
            phone: "+5491112345678",
          });
          return { tenantId: "no" };
        },
        async deleteTenant() {
          return undefined;
        },
      },
      gateway,
    );
    await assert.rejects(
      () => broken(owner),
      (error: unknown) => error instanceof BillingError && error.reason === "CLERK_FAILED",
    );
    assert.equal(tenants.length, 0);
  });

  it("borra la organización si la base falla después", async () => {
    const { openTrial, deletedOrganizations, tenants } = harness({ failProvision: true });
    await assert.rejects(
      () => openTrial(owner),
      (error: unknown) => error instanceof BillingError && error.reason === "PROVISION_FAILED",
    );
    assert.deepEqual(deletedOrganizations, ["org_1"]);
    assert.equal(tenants.length, 0);
  });

  it("rechaza un slug reservado sin llamar a Clerk", async () => {
    const { openTrial, organizations } = harness();
    await assert.rejects(
      () => openTrial({ ...owner, slug: "api" }),
      (error: unknown) => error instanceof BillingError && error.reason === "SLUG_RESERVED",
    );
    assert.equal(organizations.length, 0);
  });

  it("no pisa el slug de otro negocio", async () => {
    const { openTrial, tenants } = harness();
    await openTrial(owner);
    await assert.rejects(
      () =>
        openTrial({
          ...owner,
          ownerExternalId: "user_otro",
          ownerEmail: "otro@negocio.test",
          name: "Otro",
        }),
      (error: unknown) => error instanceof BillingError && error.reason === "SLUG_TAKEN",
    );
    assert.equal(tenants.length, 1);
  });
});
