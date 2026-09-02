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
    files: ["src/lib/env/*.ts", "*.config.ts", "*.config.mjs", "prisma/seed.ts"],
    rules: { "no-restricted-properties": "off" },
  },
  {
    files: ["src/modules/*/{application,domain}/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message: "Dominio y aplicación no importan Next.js.",
            },
            {
              name: "react",
              message: "Dominio y aplicación no importan React.",
            },
          ],
          patterns: [
            {
              group: [
                "next/*",
                "react-dom",
                "react-dom/*",
                "@clerk/*",
                "@prisma/*",
                "@/generated/*",
                "@/server/*",
                "@/app/*",
              ],
              message:
                "Dominio y aplicación no importan frameworks, Prisma, Clerk ni el borde HTTP.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/core/**/{application,domain}/**/*.ts", "src/core/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message: "El núcleo compartido no importa Next.js.",
            },
            {
              name: "react",
              message: "El núcleo compartido no importa React.",
            },
          ],
          patterns: [
            {
              group: [
                "next/*",
                "react-dom",
                "react-dom/*",
                "@clerk/*",
                "@prisma/*",
                "@/generated/*",
                "@/server/*",
                "@/app/*",
                "@/modules/*",
              ],
              message: "El núcleo compartido no importa frameworks ni módulos de dominio.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
]);

export default eslintConfig;
