import type { Role } from "@/core/authorization";

export type BookingActor = {
  tenantId: string;
  role: Role;
};

export type AgendaProfessional = {
  id: string;
  displayName: string;
  branchId: string;
  serviceIds: string[];
  isActive: boolean;
};

export type AgendaService = {
  id: string;
  name: string;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  isActive: boolean;
  priceAmount: number;
};

export type ScheduleBand = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
};

export type CalendarBlockWindow = {
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
};

export type OccupyingAppointment = {
  localTime: string;
  durationMinutes: number;
};

export type OccupyingAppointmentStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";

export type DayAppointmentRecord = {
  id: string;
  localTime: string;
  durationMinutes: number;
  status: OccupyingAppointmentStatus;
  serviceName: string;
  clientId: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientPhone: string;
};

export type MonthAppointmentStatus = OccupyingAppointmentStatus | "CANCELLED" | "NO_SHOW";

export type MonthAppointmentRecord = {
  id: string;
  localDate: string;
  localTime: string;
  durationMinutes: number;
  status: MonthAppointmentStatus;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  clientId: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientPhone: string;
};

export type MonthBlockRecord = {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  professionalId: string | null;
  professionalName: string | null;
  branchId: string | null;
  branchName: string | null;
};

export type AvailabilitySnapshot = {
  timezone: string;
  professional: AgendaProfessional | null;
  service: AgendaService | null;
  professionalBands: ScheduleBand[];
  branchBands: ScheduleBand[];
  blocks: CalendarBlockWindow[];
  appointments: OccupyingAppointment[];
};

export type AppointmentRecord = {
  id: string;
  localDate: string;
  localTime: string;
  professionalId: string;
  serviceId: string;
  clientId: string;
};

export type AppointmentDetail = AppointmentRecord & {
  status: string;
  durationMinutes: number;
  serviceName: string;
  professionalName: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientPhone: string;
};

export type ReserveSlotInput = {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  clientId: string;
  localDate: string;
  localTime: string;
  now: Date;
};

export type ReserveSlotResult =
  | { status: "created"; appointment: AppointmentRecord }
  | { status: "not_found" }
  | { status: "service_not_offered" }
  | { status: "inactive" }
  | { status: "unavailable" };

export type CancelAppointmentResult =
  | { status: "cancelled" }
  | { status: "not_found" }
  | { status: "already_cancelled" }
  | { status: "not_cancellable" };

export type MarkNoShowResult =
  | { status: "marked" }
  | { status: "not_found" }
  | { status: "already_no_show" }
  | { status: "not_no_showable" };

export type MarkCompletedResult =
  | { status: "marked" }
  | { status: "not_found" }
  | { status: "already_completed" }
  | { status: "not_completable" };

export type RescheduleSlotInput = {
  tenantId: string;
  appointmentId: string;
  professionalId: string;
  localDate: string;
  localTime: string;
  now: Date;
};

export type RescheduleSlotResult =
  | { status: "rescheduled"; appointment: AppointmentRecord }
  | { status: "not_found" }
  | { status: "not_movable" }
  | { status: "no_change" }
  | { status: "service_not_offered" }
  | { status: "inactive" }
  | { status: "unavailable" };

export type AvailabilityRepository = {
  listProfessionals(tenantId: string): Promise<AgendaProfessional[]>;
  listServices(tenantId: string): Promise<AgendaService[]>;
  loadSnapshot(
    tenantId: string,
    professionalId: string,
    serviceId: string,
    localDate: string,
    excludeAppointmentId?: string,
  ): Promise<AvailabilitySnapshot | null>;
  findAppointment(tenantId: string, appointmentId: string): Promise<AppointmentDetail | null>;
  listDayAppointments(
    tenantId: string,
    professionalId: string,
    localDate: string,
  ): Promise<DayAppointmentRecord[]>;
  listMonthAppointments(
    tenantId: string,
    fromDate: string,
    toDate: string,
  ): Promise<MonthAppointmentRecord[]>;
  listMonthBlocks(tenantId: string, fromDate: string, toDate: string): Promise<MonthBlockRecord[]>;
  reserveSlot(input: ReserveSlotInput): Promise<ReserveSlotResult>;
  rescheduleSlot(input: RescheduleSlotInput): Promise<RescheduleSlotResult>;
  cancelAppointment(
    tenantId: string,
    appointmentId: string,
    cancelledBy: string,
  ): Promise<CancelAppointmentResult>;
  markNoShow(tenantId: string, appointmentId: string): Promise<MarkNoShowResult>;
  markCompleted(tenantId: string, appointmentId: string): Promise<MarkCompletedResult>;
};
