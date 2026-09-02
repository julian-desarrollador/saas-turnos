import type { TenantConfigValidationReason } from "@/modules/tenant-config/application/errors";

const validationMessages: Record<TenantConfigValidationReason, string> = {
  NAME_REQUIRED: "El nombre es obligatorio.",
  NAME_TOO_LONG: "El nombre no puede superar 120 caracteres.",
  DURATION_MUST_BE_POSITIVE: "La duración tiene que ser un número entero mayor a cero.",
  PRICE_MUST_BE_NON_NEGATIVE: "El precio no puede ser negativo.",
  PREP_MUST_BE_NON_NEGATIVE: "La preparación no puede ser negativa.",
  CLEANUP_MUST_BE_NON_NEGATIVE: "La limpieza no puede ser negativa.",
  INVALID_TIME: "El horario tiene que tener el formato HH:MM.",
  INVALID_TIME_RANGE: "El horario de inicio no puede ser igual o posterior al de fin.",
  COLOR_INVALID: "El color tiene que ser un hex de 7 caracteres, por ejemplo #4F46E5.",
  BRANCH_REQUIRED: "Elegí una sucursal.",
  SERVICES_NOT_IN_TENANT: "Hay servicios que no pertenecen a este negocio.",
  DAY_OF_WEEK_INVALID: "El día de la semana no es válido.",
  CAPACITY_MUST_BE_POSITIVE: "La capacidad tiene que ser un número entero de al menos 1.",
  SLOTS_OVERLAP: "Hay franjas que se solapan en el mismo día.",
  SCHEDULE_OWNER_REQUIRED: "Elegí una sucursal o un profesional.",
  DATE_INVALID: "La fecha no es válida.",
  DATE_RANGE_INVALID: "La fecha de inicio no puede ser después de la de fin.",
  BLOCK_TIME_INCOMPLETE: "Si indicás un horario, tenés que completar inicio y fin.",
  REASON_TOO_LONG: "El motivo no puede superar 255 caracteres.",
};

export function validationMessage(reason: TenantConfigValidationReason | undefined): string {
  if (!reason) {
    return "Revisá los datos e intentá de nuevo.";
  }
  return validationMessages[reason];
}
