// El import de `server-only` hace que el build falle si este módulo llega a un
// bundle de cliente. Acá viven los secretos y no pueden viajar al navegador.
import "server-only";
import { z } from "zod";

import { withExplicitPgSsl } from "@/lib/pg-connection-string";

import { parseEnv } from "./parse";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url().transform(withExplicitPgSsl),
  CLERK_SECRET_KEY: z.string().startsWith("sk_"),
  CLERK_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
});

export const serverEnv = parseEnv(serverEnvSchema, process.env);
