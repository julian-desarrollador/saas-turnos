import type { PrismaClient } from "@/generated/prisma/client";
import type { PublicClientDirectory } from "@/modules/booking/application/use-cases/public-reservation";
import { createPrismaClientRepository } from "@/modules/clients";
import type { TenantDb } from "@/server/tenant-db";

export function createPrismaPublicClients(
  db: PrismaClient,
  tenantDb: TenantDb,
): PublicClientDirectory {
  const repo = createPrismaClientRepository(db, tenantDb);
  return {
    async save(input) {
      const stamp = (clientId: string) =>
        tenantDb.run(input.tenantId, (tx) =>
          tx.client.updateMany({
            where: { id: clientId, tenantId: input.tenantId },
            data: { whatsappOptIn: true, whatsappConsentAt: input.consentedAt },
          }),
        );

      const existing = await repo.findByPhone(input.tenantId, input.phone);
      if (existing) {
        const clientId = existing.firstName
          ? existing.id
          : (await repo.fillNameIfEmpty(input.tenantId, existing.id, input.firstName)).id;
        await stamp(clientId);
        return { clientId };
      }
      try {
        const created = await repo.create({
          tenantId: input.tenantId,
          phone: input.phone,
          firstName: input.firstName,
        });
        await stamp(created.id);
        return { clientId: created.id };
      } catch (error) {
        if (error instanceof Error && error.message === "PHONE_TAKEN") {
          const raced = await repo.findByPhone(input.tenantId, input.phone);
          if (raced) {
            await stamp(raced.id);
            return { clientId: raced.id };
          }
        }
        throw error;
      }
    },
  };
}
