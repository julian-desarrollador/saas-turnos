export type { Role, Permission } from "@/core/authorization";
export { hasPermission } from "@/core/authorization";

export type {
  BranchRecord,
  ProfessionalRecord,
  ServiceRecord,
} from "./application/ports/catalog-repository";
export type {
  CalendarBlockRecord,
  WeeklySlotRecord,
} from "./application/ports/schedule-repository";

export {
  loadProfessionalsPage,
  loadServicesPage,
  loadSchedulePage,
  createProfessionalAction,
  updateProfessionalAction,
  setProfessionalServicesAction,
  createServiceAction,
  updateServiceAction,
  setWeeklyScheduleAction,
  createCalendarBlockAction,
  deleteCalendarBlockAction,
} from "./adapters/inbound/actions";
export type { ActionState } from "./adapters/inbound/actions";
