import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({
    connectionString: serverEnv.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

function isCurrentClient(client: PrismaClient | undefined): client is PrismaClient {
  // En dev el cliente se cachea en globalThis. Tras `prisma generate`, HMR reusa
  // la instancia vieja y los modelos nuevos quedan undefined.
  return typeof client?.membershipInvite?.findMany === "function";
}

export const db = isCurrentClient(globalForPrisma.prisma) ? globalForPrisma.prisma : createClient();

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
