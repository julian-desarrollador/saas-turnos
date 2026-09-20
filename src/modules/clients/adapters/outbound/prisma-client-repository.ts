import type { PrismaClient } from "@/generated/prisma/client";

import type {
  ClientAppointmentRecord,
  ClientAppointmentStatus,
  ClientRepository,
  ClientSearchTerm,
} from "@/modules/clients/application/ports/client-repository";

const clientListSelect = {
  id: true,
  tenantId: true,
  phone: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const clientFichaSelect = {
  ...clientListSelect,
  notes: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

function toAppointmentStatus(status: string): ClientAppointmentStatus {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
    case "IN_PROGRESS":
    case "COMPLETED":
    case "CANCELLED":
    case "NO_SHOW":
      return status;
    default:
      return "CONFIRMED";
  }
}

function termWhere(term: ClientSearchTerm) {
  const or: object[] = [];
  if (term.name) {
    or.push({ firstName: { contains: term.name, mode: "insensitive" as const } });
    or.push({ lastName: { contains: term.name, mode: "insensitive" as const } });
  }
  if (term.phoneExact) {
    or.push({ phone: term.phoneExact });
  }
  if (term.phoneContains) {
    or.push({ phone: { contains: term.phoneContains } });
  }
  return { OR: or };
}

export function createPrismaClientRepository(db: PrismaClient): ClientRepository {
  return {
    async findByPhone(tenantId, phone) {
      return db.client.findFirst({
        where: { tenantId, phone },
        select: clientListSelect,
      });
    },
    async findById(tenantId, id) {
      return db.client.findFirst({
        where: { tenantId, id },
        select: clientFichaSelect,
      });
    },
    async listByTenant(tenantId, terms, limit) {
      return db.client.findMany({
        where: {
          tenantId,
          ...(terms.length > 0 ? { AND: terms.map(termWhere) } : {}),
        },
        select: clientListSelect,
        orderBy: [
          { lastName: { sort: "asc", nulls: "last" } },
          { firstName: { sort: "asc", nulls: "last" } },
          { phone: "asc" },
        ],
        take: limit,
      });
    },
    async listVisitSummaries(tenantId, clientIds) {
      if (clientIds.length === 0) {
        return [];
      }
      const rows = await db.appointment.groupBy({
        by: ["clientId"],
        where: { tenantId, clientId: { in: clientIds } },
        _count: { _all: true },
        _max: { localDate: true },
      });
      return rows.map((row) => ({
        clientId: row.clientId,
        visitCount: row._count._all,
        lastVisitLocalDate: row._max.localDate,
      }));
    },
    async listAppointments(tenantId, clientId, limit) {
      const rows = await db.appointment.findMany({
        where: { tenantId, clientId },
        select: {
          id: true,
          professionalId: true,
          localDate: true,
          localTime: true,
          durationMinutes: true,
          status: true,
          professional: { select: { displayName: true } },
          services: { select: { serviceName: true } },
        },
        orderBy: [{ localDate: "desc" }, { localTime: "desc" }, { id: "desc" }],
        take: limit,
      });
      return rows.map((row): ClientAppointmentRecord => ({
        id: row.id,
        professionalId: row.professionalId,
        professionalName: row.professional.displayName,
        localDate: row.localDate,
        localTime: row.localTime,
        durationMinutes: row.durationMinutes,
        status: toAppointmentStatus(row.status),
        serviceName: row.services[0]?.serviceName ?? "Servicio",
      }));
    },
    async create(data) {
      try {
        return await db.client.create({
          data: {
            tenantId: data.tenantId,
            phone: data.phone,
            firstName: data.firstName,
          },
          select: clientListSelect,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new Error("PHONE_TAKEN");
        }
        throw error;
      }
    },
    async fillNameIfEmpty(tenantId, id, firstName) {
      const existing = await db.client.findFirst({
        where: { tenantId, id, firstName: null },
        select: { id: true },
      });
      if (!existing) {
        const current = await db.client.findFirst({
          where: { tenantId, id },
          select: clientListSelect,
        });
        if (!current) {
          throw new Error("CLIENT_NOT_FOUND");
        }
        return current;
      }
      return db.client.update({
        where: { id },
        data: { firstName },
        select: clientListSelect,
      });
    },
    async updateIdentity(tenantId, id, data) {
      const existing = await db.client.findFirst({
        where: { tenantId, id },
        select: { id: true },
      });
      if (!existing) {
        throw new Error("CLIENT_NOT_FOUND");
      }
      try {
        return await db.client.update({
          where: { id },
          data: { phone: data.phone, firstName: data.firstName },
          select: clientFichaSelect,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new Error("PHONE_TAKEN");
        }
        throw error;
      }
    },
  };
}
