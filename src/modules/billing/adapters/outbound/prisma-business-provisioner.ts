import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { BillingError } from "@/modules/billing/application/errors";
import type { BusinessProvisioner } from "@/modules/billing/application/ports/business-provisioner";
import type { TenantDb } from "@/server/tenant-db";

const OPEN_DAYS = [1, 2, 3, 4, 5, 6];

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export function createPrismaBusinessProvisioner(
  db: PrismaClient,
  tenantDb: TenantDb,
): BusinessProvisioner {
  return {
    async isSlugTaken(slug) {
      const row = await db.tenant.findUnique({ where: { slug }, select: { id: true } });
      return row !== null;
    },
    async deleteTenant(tenantId) {
      await db.tenant.delete({ where: { id: tenantId } }).catch(() => undefined);
    },
    async provision(input) {
      const user = await db.user.upsert({
        where: { externalId: input.ownerExternalId },
        create: {
          externalId: input.ownerExternalId,
          email: input.ownerEmail,
          firstName: input.ownerFirstName,
        },
        update: {
          email: input.ownerEmail,
          ...(input.ownerFirstName ? { firstName: input.ownerFirstName } : {}),
        },
      });

      let tenantId: string;
      try {
        const tenant = await db.tenant.create({
          data: {
            slug: input.slug,
            name: input.name,
            timezone: input.timezone,
            currency: "ARS",
            plan: input.plan,
            subscriptionStatus: "TRIAL",
            trialEndsAt: input.trialEndsAt,
            employeeLimit: input.employeeLimit,
            messageMonthlyCap: input.messageMonthlyCap,
            clerkOrganizationId: input.clerkOrganizationId,
          },
          select: { id: true },
        });
        tenantId = tenant.id;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new BillingError("CONFLICT", "SLUG_TAKEN", "slug");
        }
        throw error;
      }

      try {
        await tenantDb.run(tenantId, async (tx) => {
          const branch = await tx.branch.create({
            data: { tenantId, name: "Sede principal", phone: input.branchPhone },
            select: { id: true },
          });
          const professional = await tx.professional.create({
            data: {
              tenantId,
              branchId: branch.id,
              displayName: input.ownerFirstName?.trim() || input.name,
            },
            select: { id: true },
          });
          const service = await tx.service.create({
            data: {
              tenantId,
              name: "Corte",
              durationMinutes: 45,
              priceAmount: 8000,
              prepMinutes: 0,
              cleanupMinutes: 5,
            },
            select: { id: true },
          });
          await tx.professionalService.create({
            data: {
              tenantId,
              professionalId: professional.id,
              serviceId: service.id,
            },
          });
          await tx.weeklySchedule.createMany({
            data: OPEN_DAYS.flatMap((dayOfWeek) => [
              {
                tenantId,
                branchId: branch.id,
                dayOfWeek,
                startTime: "09:00",
                endTime: "18:00",
                capacity: 1,
              },
              {
                tenantId,
                professionalId: professional.id,
                dayOfWeek,
                startTime: "09:00",
                endTime: "18:00",
                capacity: 1,
              },
            ]),
          });
        });
        await db.membership.create({
          data: { tenantId, userId: user.id, role: "OWNER" },
        });
      } catch (error) {
        await db.tenant.delete({ where: { id: tenantId } }).catch(() => undefined);
        throw error;
      }

      return { tenantId };
    },
  };
}
