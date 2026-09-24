import type { PrismaClient } from "@/generated/prisma/client";
import type { TenantDb } from "@/server/tenant-db";
import type {
  CatalogRepositories,
  CreateProfessionalData,
  CreateServiceData,
  ProfessionalRecord,
  ServiceRecord,
  UpdateProfessionalData,
  UpdateServiceData,
} from "@/modules/tenant-config/application/ports/catalog-repository";

const professionalSelect = {
  id: true,
  tenantId: true,
  branchId: true,
  displayName: true,
  color: true,
  isActive: true,
  services: { select: { serviceId: true } },
} as const;

const serviceSelect = {
  id: true,
  tenantId: true,
  name: true,
  durationMinutes: true,
  priceAmount: true,
  prepMinutes: true,
  cleanupMinutes: true,
  earliestStart: true,
  latestStart: true,
  requiresDeposit: true,
  isActive: true,
} as const;

type ProfessionalRow = {
  id: string;
  tenantId: string;
  branchId: string;
  displayName: string;
  color: string | null;
  isActive: boolean;
  services: { serviceId: string }[];
};

function toProfessional(row: ProfessionalRow): ProfessionalRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    branchId: row.branchId,
    displayName: row.displayName,
    color: row.color,
    isActive: row.isActive,
    serviceIds: row.services.map((link) => link.serviceId),
  };
}

function toService(row: ServiceRecord): ServiceRecord {
  return row;
}

export function createPrismaCatalogRepositories(
  _db: PrismaClient,
  tenantDb: TenantDb,
): CatalogRepositories {
  return {
    branches: {
      async listByTenant(tenantId) {
        return tenantDb.run(tenantId, (tx) =>
          tx.branch.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          }),
        );
      },
      async findById(tenantId, id) {
        return tenantDb.run(tenantId, (tx) =>
          tx.branch.findFirst({
            where: { tenantId, id, isActive: true },
            select: { id: true, name: true },
          }),
        );
      },
    },
    professionals: {
      async listByTenant(tenantId) {
        return tenantDb.run(tenantId, async (tx) => {
          const rows = await tx.professional.findMany({
            where: { tenantId },
            select: professionalSelect,
            orderBy: { displayName: "asc" },
          });
          return rows.map(toProfessional);
        });
      },
      async findById(tenantId, id) {
        return tenantDb.run(tenantId, async (tx) => {
          const row = await tx.professional.findFirst({
            where: { tenantId, id },
            select: professionalSelect,
          });
          return row ? toProfessional(row) : null;
        });
      },
      async create(data: CreateProfessionalData) {
        const row = await tenantDb.run(data.tenantId, async (tx) => {
          const branch = await tx.branch.findFirst({
            where: { tenantId: data.tenantId, id: data.branchId },
            select: { id: true },
          });
          if (!branch) {
            return null;
          }
          return tx.professional.create({
            data: {
              tenantId: data.tenantId,
              branchId: data.branchId,
              displayName: data.displayName,
              color: data.color,
            },
            select: professionalSelect,
          });
        });
        if (!row) {
          throw new Error("BRANCH_NOT_IN_TENANT");
        }
        return toProfessional(row);
      },
      async update(tenantId, id, data: UpdateProfessionalData) {
        return tenantDb.run(tenantId, async (tx) => {
          const existing = await tx.professional.findFirst({
            where: { tenantId, id },
            select: { id: true },
          });
          if (!existing) {
            return null;
          }
          const row = await tx.professional.update({
            where: { id },
            data,
            select: professionalSelect,
          });
          return toProfessional(row);
        });
      },
      async setServices(tenantId, professionalId, serviceIds) {
        return tenantDb.run(tenantId, async (tx) => {
          const professional = await tx.professional.findFirst({
            where: { tenantId, id: professionalId },
            select: { id: true },
          });
          if (!professional) {
            return null;
          }

          const services = await tx.service.findMany({
            where: { tenantId, id: { in: serviceIds } },
            select: { id: true },
          });
          if (services.length !== serviceIds.length) {
            return null;
          }

          await tx.professionalService.deleteMany({
            where: { professionalId },
          });
          if (serviceIds.length > 0) {
            await tx.professionalService.createMany({
              data: serviceIds.map((serviceId) => ({
                tenantId,
                professionalId,
                serviceId,
              })),
            });
          }

          const row = await tx.professional.findFirst({
            where: { tenantId, id: professionalId },
            select: professionalSelect,
          });
          return row ? toProfessional(row) : null;
        });
      },
    },
    services: {
      async listByTenant(tenantId) {
        return tenantDb.run(tenantId, async (tx) => {
          const rows = await tx.service.findMany({
            where: { tenantId },
            select: serviceSelect,
            orderBy: { name: "asc" },
          });
          return rows.map(toService);
        });
      },
      async findById(tenantId, id) {
        return tenantDb.run(tenantId, (tx) =>
          tx.service.findFirst({
            where: { tenantId, id },
            select: serviceSelect,
          }),
        );
      },
      async create(data: CreateServiceData) {
        return tenantDb.run(data.tenantId, (tx) =>
          tx.service.create({
            data,
            select: serviceSelect,
          }),
        );
      },
      async update(tenantId, id, data: UpdateServiceData) {
        return tenantDb.run(tenantId, async (tx) => {
          const existing = await tx.service.findFirst({
            where: { tenantId, id },
            select: { id: true },
          });
          if (!existing) {
            return null;
          }
          return tx.service.update({
            where: { id },
            data,
            select: serviceSelect,
          });
        });
      },
    },
  };
}
