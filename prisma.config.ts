import { config } from "dotenv";
import { defineConfig } from "prisma/config";

import { withExplicitPgSsl } from "./src/lib/pg-connection-string";

config({ path: ".env.local" });

// Las migraciones usan el rol dueño. Mientras DATABASE_URL siga siendo ese rol,
// DIRECT_URL puede faltar y se usa la misma URL.
const databaseUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl ? withExplicitPgSsl(databaseUrl) : databaseUrl,
  },
});
