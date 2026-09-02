import type { ClientsValidationReason } from "@/modules/clients/application/errors";
import type { ClientAppointmentStatus } from "@/modules/clients/application/ports/client-repository";

const validationMessages: Record<ClientsValidationReason, string> = {
  PHONE_INVALID: "El teléfono no es válido. Usá código de país, por ejemplo +5491123456789.",
  NAME_TOO_LONG: "El nombre no puede superar 100 caracteres.",
  QUERY_TOO_LONG: "La búsqueda es demasiado larga.",
};

export function clientsValidationMessage(reason: ClientsValidationReason | undefined): string {
  if (!reason) {
    return "Revisá los datos e intentá de nuevo.";
  }
  return validationMessages[reason];
}

const appointmentStatusLabels: Record<ClientAppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Atendido",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

export function appointmentStatusLabel(status: ClientAppointmentStatus): string {
  return appointmentStatusLabels[status];
}

export function clientDisplayName(client: {
  firstName: string | null;
  lastName: string | null;
  phone: string;
}): string {
  const name = [client.firstName, client.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || client.phone;
}
