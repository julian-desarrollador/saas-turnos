import { config } from "dotenv";
import { defineConfig } from "prisma/config";

import { withExplicitPgSsl } from "./src/lib/pg-connection-string";

config({ path: ".env.local" });

const databaseUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl ? withExplicitPgSsl(databaseUrl) : databaseUrl,
  },
});
