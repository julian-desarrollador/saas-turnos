import { randomUUID } from "node:crypto";

import type {
  ClientAppointmentRecord,
  ClientFicha,
  ClientRecord,
  ClientRepository,
} from "@/modules/clients/application/ports/client-repository";
import { clientMatchesSearch, compareClientRecords } from "@/modules/clients/application/search";

type StoredAppointment = ClientAppointmentRecord & {
  tenantId: string;
  clientId: string;
};

function toRecord(row: ClientFicha): ClientRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    phone: row.phone,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
  };
}

export function createMemoryClientRepository(
  seed: ClientFicha[] = [],
  appointments: StoredAppointment[] = [],
): ClientRepository {
  const rows = new Map(seed.map((row) => [row.id, { ...row }]));
  const appointmentRows = appointments.map((row) => ({ ...row }));

  function byPhone(tenantId: string, phone: string) {
    return [...rows.values()].find((row) => row.tenantId === tenantId && row.phone === phone);
  }

  return {
    async findByPhone(tenantId, phone) {
      const row = byPhone(tenantId, phone);
      return row ? toRecord(row) : null;
    },
    async findById(tenantId, id) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        return null;
      }
      return { ...row };
    },
    async listByTenant(tenantId, terms, limit) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId && clientMatchesSearch(row, terms))
        .map(toRecord)
        .sort(compareClientRecords)
        .slice(0, limit);
    },
    async listVisitSummaries(tenantId, clientIds) {
      const wanted = new Set(clientIds);
      const totals = new Map<string, { visitCount: number; lastVisitLocalDate: string | null }>();
      for (const clientId of clientIds) {
        totals.set(clientId, { visitCount: 0, lastVisitLocalDate: null });
      }
      for (const appointment of appointmentRows) {
        if (appointment.tenantId !== tenantId || !wanted.has(appointment.clientId)) {
          continue;
        }
        const current = totals.get(appointment.clientId);
        if (!current) {
          continue;
        }
        current.visitCount += 1;
        if (!current.lastVisitLocalDate || appointment.localDate > current.lastVisitLocalDate) {
          current.lastVisitLocalDate = appointment.localDate;
        }
      }
      return [...totals.entries()].map(([clientId, summary]) => ({
        clientId,
        visitCount: summary.visitCount,
        lastVisitLocalDate: summary.lastVisitLocalDate,
      }));
    },
    async listAppointments(tenantId, clientId, limit) {
      return appointmentRows
        .filter((row) => row.tenantId === tenantId && row.clientId === clientId)
        .sort(
          (left, right) =>
            right.localDate.localeCompare(left.localDate) ||
            right.localTime.localeCompare(left.localTime) ||
            right.id.localeCompare(left.id),
        )
        .slice(0, limit)
        .map((row) => ({
          id: row.id,
          professionalId: row.professionalId,
          professionalName: row.professionalName,
          localDate: row.localDate,
          localTime: row.localTime,
          durationMinutes: row.durationMinutes,
          status: row.status,
          serviceName: row.serviceName,
        }));
    },
    async create(data) {
      if (byPhone(data.tenantId, data.phone)) {
        throw new Error("PHONE_TAKEN");
      }
      const row: ClientFicha = {
        id: randomUUID(),
        tenantId: data.tenantId,
        phone: data.phone,
        firstName: data.firstName,
        lastName: null,
        email: null,
        notes: null,
      };
      rows.set(row.id, row);
      return toRecord(row);
    },
    async fillNameIfEmpty(tenantId, id, firstName) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        throw new Error("CLIENT_NOT_FOUND");
      }
      if (!row.firstName) {
        row.firstName = firstName;
      }
      return toRecord(row);
    },
    async updateIdentity(tenantId, id, data) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        throw new Error("CLIENT_NOT_FOUND");
      }
      const taken = byPhone(tenantId, data.phone);
      if (taken && taken.id !== id) {
        throw new Error("PHONE_TAKEN");
      }
      row.phone = data.phone;
      row.firstName = data.firstName;
      return { ...row };
    },
  };
}
