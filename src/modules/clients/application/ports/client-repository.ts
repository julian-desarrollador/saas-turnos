import type { Role } from "@/core/authorization";

export type ClientsActor = {
  tenantId: string;
  role: Role;
};

export type ClientRecord = {
  id: string;
  tenantId: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type ClientFicha = ClientRecord & {
  notes: string | null;
};

export type ClientAppointmentStatus =
  "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type ClientAppointmentRecord = {
  id: string;
  professionalId: string;
  professionalName: string;
  localDate: string;
  localTime: string;
  durationMinutes: number;
  status: ClientAppointmentStatus;
  serviceName: string;
};

export type ClientSearchTerm = {
  name: string | null;
  phoneExact: string | null;
  phoneContains: string | null;
};

export type ClientVisitSummary = {
  clientId: string;
  visitCount: number;
  lastVisitLocalDate: string | null;
};

export type ClientRepository = {
  findByPhone(tenantId: string, phone: string): Promise<ClientRecord | null>;
  findById(tenantId: string, id: string): Promise<ClientFicha | null>;
  listByTenant(tenantId: string, terms: ClientSearchTerm[], limit: number): Promise<ClientRecord[]>;
  listVisitSummaries(tenantId: string, clientIds: string[]): Promise<ClientVisitSummary[]>;
  listAppointments(
    tenantId: string,
    clientId: string,
    limit: number,
  ): Promise<ClientAppointmentRecord[]>;
  create(data: {
    tenantId: string;
    phone: string;
    firstName: string | null;
  }): Promise<ClientRecord>;
  fillNameIfEmpty(tenantId: string, id: string, firstName: string): Promise<ClientRecord>;
};
