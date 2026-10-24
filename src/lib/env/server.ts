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
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  META_WHATSAPP_TOKEN: z.string().min(1).optional(),
  META_WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_URL: z
    .string()
    .url()
    .transform((value) => value.replace(/\/+$/, ""))
    .optional(),
});

export const serverEnv = parseEnv(serverEnvSchema, process.env);
