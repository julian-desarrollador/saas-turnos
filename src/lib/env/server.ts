// El import de `server-only` hace que el build falle si este módulo llega a un
// bundle de cliente. Acá viven los secretos y no pueden viajar al navegador.
import "server-only";
import { z } from "zod";

import { parseEnv } from "./parse";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
});

export const serverEnv = parseEnv(serverEnvSchema, process.env);
