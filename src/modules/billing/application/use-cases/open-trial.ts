import { normalizeEmail } from "@/core/membership/application/email";
import { isReservedTenantSlug, isTenantSlug } from "@/core/tenant-slug";
import { normalizePhone } from "@/modules/clients/domain/phone";

import {
  employeeLimit,
  isPlanCode,
  messageCap,
  trialEndsAt,
  type PlanCode,
} from "../../domain/subscription";
import { BillingError } from "../errors";
import type { BusinessProvisioner, OrganizationGateway } from "../ports/business-provisioner";

const NAME_MAX = 120;

function isTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function createOpenTrial(
  provisioner: BusinessProvisioner,
  organizations: OrganizationGateway,
) {
  return async function openTrial(input: {
    ownerExternalId: string;
    ownerEmail: string;
    ownerFirstName: string | null;
    name: string;
    slug: string;
    timezone: string;
    plan: string;
    phone: string;
    now: Date;
  }): Promise<{ tenantId: string; slug: string; trialEndsAt: Date }> {
    const name = input.name.trim();
    if (!name || name.length > NAME_MAX) {
      throw new BillingError("VALIDATION", "NAME_INVALID", "name");
    }
    const slug = input.slug.trim().toLowerCase();
    if (!isTenantSlug(slug)) {
      throw new BillingError("VALIDATION", "SLUG_INVALID", "slug");
    }
    if (isReservedTenantSlug(slug)) {
      throw new BillingError("VALIDATION", "SLUG_RESERVED", "slug");
    }
    if (!isTimeZone(input.timezone)) {
      throw new BillingError("VALIDATION", "TIMEZONE_INVALID", "timezone");
    }
    if (!isPlanCode(input.plan)) {
      throw new BillingError("VALIDATION", "PLAN_INVALID", "plan");
    }
    const email = normalizeEmail(input.ownerEmail);
    if (!email) {
      throw new BillingError("VALIDATION", "EMAIL_INVALID", "email");
    }
    const phone = normalizePhone(input.phone);
    if (!phone) {
      throw new BillingError("VALIDATION", "PHONE_INVALID", "phone");
    }

    const plan: PlanCode = input.plan;
    if (await provisioner.isSlugTaken(slug)) {
      throw new BillingError("CONFLICT", "SLUG_TAKEN", "slug");
    }

    let organizationId: string;
    try {
      const organization = await organizations.createOrganization({
        name,
        createdByExternalId: input.ownerExternalId,
      });
      organizationId = organization.id;
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      throw new BillingError("EXTERNAL", "CLERK_FAILED");
    }

    const ends = trialEndsAt(input.now);
    try {
      const created = await provisioner.provision({
        ownerExternalId: input.ownerExternalId,
        ownerEmail: email,
        ownerFirstName: input.ownerFirstName,
        name,
        slug,
        timezone: input.timezone,
        plan,
        employeeLimit: employeeLimit(plan),
        messageMonthlyCap: messageCap(plan),
        trialEndsAt: ends,
        clerkOrganizationId: organizationId,
        branchPhone: phone,
      });
      return { tenantId: created.tenantId, slug, trialEndsAt: ends };
    } catch (error) {
      await organizations.deleteOrganization(organizationId).catch(() => undefined);
      if (error instanceof BillingError) {
        throw error;
      }
      throw new BillingError("EXTERNAL", "PROVISION_FAILED");
    }
  };
}
