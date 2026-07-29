import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Va después de las configuraciones de Next: apaga las reglas de estilo que
  // chocarían con Prettier.
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Toda variable de entorno pasa por el esquema de src/lib/env, que es lo
      // único que garantiza que exista y tenga el formato esperado.
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Leé las variables desde @/lib/env/server o @/lib/env/client, donde están validadas.",
        },
      ],
    },
  },
  {
    files: ["src/lib/env/*.ts", "*.config.ts", "*.config.mjs"],
    rules: { "no-restricted-properties": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
