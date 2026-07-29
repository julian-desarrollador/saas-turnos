import { z } from "zod";

import { parseEnv } from "./parse";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
});

// Next.js reemplaza `process.env.NEXT_PUBLIC_*` por el valor literal durante el
// build, y solo lo hace cuando la propiedad se escribe de forma estática. Por eso
// cada variable se enumera una por una en lugar de pasar `process.env` completo.
export const clientEnv = parseEnv(clientEnvSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
