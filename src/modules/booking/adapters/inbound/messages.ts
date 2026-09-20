import type { BookingValidationReason } from "@/modules/booking/application/errors";
import type { EmptySlotsReason } from "@/modules/booking/application/offered-from-snapshot";

const validationMessages: Record<BookingValidationReason, string> = {
  DATE_INVALID: "La fecha no es válida.",
  TIME_INVALID: "El horario no es válido.",
  SERVICE_NOT_OFFERED: "Ese profesional no ofrece este servicio.",
  SLOT_UNAVAILABLE: "Ese horario ya no está disponible. Elegí otro.",
  ALREADY_CANCELLED: "Ese turno ya estaba cancelado.",
  NOT_CANCELLABLE: "Ese turno no se puede cancelar.",
  ALREADY_NO_SHOW: "Ese turno ya estaba marcado como ausente.",
  NOT_NO_SHOWABLE: "Ese turno no se puede marcar como ausente.",
  ALREADY_COMPLETED: "Ese turno ya estaba marcado como atendido.",
  NOT_COMPLETABLE: "Ese turno no se puede marcar como atendido.",
  NOT_MOVABLE: "Ese turno no se puede reprogramar.",
  NO_CHANGE: "Elegí un día, horario o profesional distinto al actual.",
};

const emptySlotsMessages: Record<EmptySlotsReason, string> = {
  PAST_DATE: "Ese día ya pasó. Elegí hoy o una fecha futura.",
  TODAY_ENDED: "Hoy ya no quedan horarios libres. Elegí otro día.",
  NO_PROFESSIONAL_HOURS: "Este profesional no tiene horario para este día. Cargalo en Horarios.",
  NO_BRANCH_HOURS: "La sucursal no tiene horario para este día. Cargalo en Horarios.",
  INACTIVE: "Ese profesional o servicio está inactivo.",
  BRANCH_BLOCKED: "Hay un bloqueo de la sucursal este día.",
  NONE_FIT: "No hay horarios disponibles para esta combinación.",
};

export function validationMessage(reason: BookingValidationReason | undefined): string {
  if (!reason) {
    return "Revisá los datos e intentá de nuevo.";
  }
  return validationMessages[reason];
}

export function emptySlotsMessage(reason: EmptySlotsReason | null | undefined): string {
  if (!reason) {
    return emptySlotsMessages.NONE_FIT;
  }
  return emptySlotsMessages[reason];
}
