import type { z } from "zod";

/**
 * Valida un conjunto de variables de entorno contra un esquema y corta la
 * ejecución si alguna falta o tiene un formato inesperado. Informa todos los
 * problemas juntos, porque al configurar un entorno nuevo lo habitual es que
 * falte más de una variable y descubrirlas de a una es tiempo perdido.
 */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: unknown,
): z.output<Schema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  · ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Variables de entorno inválidas o faltantes:\n${detail}`);
  }

  return result.data;
}
