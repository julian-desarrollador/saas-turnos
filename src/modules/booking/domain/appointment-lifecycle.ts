export const CANCELLED_BY_BUSINESS = "BUSINESS";

export function occupiesAgenda(status: string): boolean {
  return (
    status === "PENDING" ||
    status === "CONFIRMED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED"
  );
}

/** Pending, confirmed or in progress: can cancel, reschedule, mark no-show or completed. */
export function isOpenAppointment(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
}

export function canCancelAppointment(status: string): boolean {
  return isOpenAppointment(status);
}

export function canRescheduleAppointment(status: string): boolean {
  return isOpenAppointment(status);
}

export function canMarkNoShow(status: string): boolean {
  return isOpenAppointment(status);
}

export function canMarkCompleted(status: string): boolean {
  return isOpenAppointment(status);
}
