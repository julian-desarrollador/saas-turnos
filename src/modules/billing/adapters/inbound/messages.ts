import type { BillingReason } from "@/modules/billing/application/errors";
import { plans, type PlanCode } from "@/modules/billing/domain/subscription";

const messages: Record<BillingReason, string> = {
  NAME_INVALID: "El nombre del negocio tiene que tener entre 1 y 120 caracteres.",
  SLUG_INVALID: "El enlace solo puede tener letras minúsculas, números y guiones.",
  SLUG_RESERVED: "Ese enlace está reservado. Elegí otro.",
  SLUG_TAKEN: "Ese enlace ya lo usa otro negocio.",
  TIMEZONE_INVALID: "La zona horaria no es válida.",
  PLAN_INVALID: "Elegí un plan.",
  EMAIL_INVALID: "Tu cuenta no tiene un correo válido.",
  PHONE_INVALID: "El teléfono del negocio no es válido.",
  CLERK_FAILED: "No pudimos crear la organización. Reintentá en un momento.",
  PROVISION_FAILED: "No pudimos guardar el negocio. No quedó una organización a medias.",
  PAYMENT_FAILED: "El cobro no se acreditó.",
  NOT_CONFIGURED: "El cobro todavía no está configurado.",
  PERIOD_INVALID: "Elegí pagar un mes o el año.",
  AMOUNT_TOO_LOW: "El monto pagado no alcanza el precio del período.",
  ALREADY_LINKED: "El débito automático ya está asociado.",
  SUBSCRIPTION_CANCELLED: "La suscripción está cancelada.",
  TENANT_NOT_FOUND: "No encontramos el negocio.",
};

export function billingMessage(reason: BillingReason | undefined): string {
  if (!reason) {
    return "Revisá los datos e intentá de nuevo.";
  }
  return messages[reason];
}

const planLabels: Record<PlanCode, string> = {
  INICIO: "Inicio",
  NEGOCIO: "Negocio",
  EQUIPO: "Equipo",
};

const pesos = new Intl.NumberFormat("es-AR");

export const planOptions = (Object.keys(plans) as PlanCode[]).map((id) => ({
  id,
  label: planLabels[id],
  detail: `$${pesos.format(plans[id].monthlyArs)} por mes · hasta ${plans[id].employeeLimit} personas · ${pesos.format(plans[id].messageCap)} mensajes`,
}));
