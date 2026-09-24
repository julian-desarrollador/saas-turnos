import type { PrismaClient } from "@/generated/prisma/client";

export type TenantTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export type TenantDb = {
  run<T>(tenantId: string, work: (tx: TenantTx) => Promise<T>): Promise<T>;
};

export function createTenantDb(client: PrismaClient): TenantDb {
  return {
    async run(tenantId, work) {
      return client.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        return work(tx as TenantTx);
      });
    },
  };
}
