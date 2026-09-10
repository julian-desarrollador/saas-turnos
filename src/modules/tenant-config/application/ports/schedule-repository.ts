import type { CatalogActor } from "./catalog-repository";

export type ScheduleActor = CatalogActor;

export type ScheduleOwnerKind = "branch" | "professional";

export type ScheduleOwner = {
  kind: ScheduleOwnerKind;
  id: string;
};

export type WeeklySlotInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
};

export type WeeklySlotRecord = WeeklySlotInput & {
  id: string;
  tenantId: string;
  branchId: string | null;
  professionalId: string | null;
};

export type CalendarBlockRecord = {
  id: string;
  tenantId: string;
  branchId: string | null;
  professionalId: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export type CreateCalendarBlockData = {
  tenantId: string;
  owner: ScheduleOwner;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export type WeeklyScheduleRepository = {
  listByTenant(tenantId: string): Promise<WeeklySlotRecord[]>;
  listByOwner(tenantId: string, owner: ScheduleOwner): Promise<WeeklySlotRecord[] | null>;
  replaceByOwner(
    tenantId: string,
    owner: ScheduleOwner,
    slots: WeeklySlotInput[],
  ): Promise<WeeklySlotRecord[] | null>;
};

export type CalendarBlockRepository = {
  listByTenant(tenantId: string): Promise<CalendarBlockRecord[]>;
  createMany(items: CreateCalendarBlockData[]): Promise<CalendarBlockRecord[] | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
};

export type ScheduleRepositories = {
  weekly: WeeklyScheduleRepository;
  blocks: CalendarBlockRepository;
};
