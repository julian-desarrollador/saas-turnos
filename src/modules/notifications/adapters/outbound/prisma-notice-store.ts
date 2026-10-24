import type { PrismaClient } from "@/generated/prisma/client";
import type { NoticeStore } from "@/modules/notifications/application/ports/notice-store";
import type { TenantDb } from "@/server/tenant-db";

export function createPrismaNoticeStore(db: PrismaClient, tenantDb: TenantDb): NoticeStore {
  return {
    async replacePending(input) {
      await tenantDb.run(input.tenantId, async (tx) => {
        await tx.notification.deleteMany({
          where: {
            tenantId: input.tenantId,
            appointmentId: input.appointmentId,
            status: { in: ["PENDING", "CANCELLED", "FAILED"] },
          },
        });
        if (input.rows.length === 0) {
          return;
        }
        await tx.notification.createMany({
          data: input.rows.map((row) => ({
            tenantId: input.tenantId,
            appointmentId: input.appointmentId,
            kind: row.kind,
            sendAt: row.sendAt,
            idempotencyKey: row.idempotencyKey,
            status: "PENDING" as const,
          })),
        });
      });
    },
    async cancelPending(tenantId, appointmentId) {
      await tenantDb.run(tenantId, (tx) =>
        tx.notification.updateMany({
          where: { tenantId, appointmentId, status: "PENDING" },
          data: { status: "CANCELLED" },
        }),
      );
    },
    async listTenantIds() {
      const tenants = await db.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      return tenants.map((tenant) => tenant.id);
    },
    async quota(tenantId) {
      const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { messageMonthlyCap: true, timezone: true },
      });
      return {
        cap: tenant?.messageMonthlyCap ?? 80,
        timeZone: tenant?.timezone ?? "America/Argentina/Buenos_Aires",
      };
    },
    async listDue(tenantId, now) {
      return tenantDb.run(tenantId, async (tx) => {
        const rows = await tx.notification.findMany({
          where: { tenantId, status: "PENDING", sendAt: { lte: now } },
          include: {
            tenant: { select: { name: true } },
            appointment: {
              select: {
                localDate: true,
                localTime: true,
                client: { select: { phone: true, whatsappOptIn: true } },
                branch: { select: { phone: true } },
                services: { select: { serviceName: true }, take: 1 },
              },
            },
          },
          orderBy: { sendAt: "asc" },
          take: 20,
        });
        return rows
          .filter((row) => row.appointment.client.whatsappOptIn)
          .map((row) => ({
            id: row.id,
            tenantId,
            phone: row.appointment.client.phone,
            businessName: row.tenant.name,
            localDate: row.appointment.localDate,
            localTime: row.appointment.localTime,
            serviceName: row.appointment.services[0]?.serviceName ?? "Turno",
            businessPhone: row.appointment.branch.phone ?? "el negocio",
            kind: row.kind,
          }));
      });
    },
    async claim(tenantId, id) {
      return tenantDb.run(tenantId, async (tx) => {
        const result = await tx.notification.updateMany({
          where: { id, tenantId, status: "PENDING" },
          data: { status: "SENT", attempts: { increment: 1 } },
        });
        return result.count === 1;
      });
    },
    async countSent(tenantId, from, to) {
      return tenantDb.run(tenantId, (tx) =>
        tx.notification.count({
          where: {
            tenantId,
            status: "SENT",
            sendAt: { gte: from, lt: to },
          },
        }),
      );
    },
    async markRetry(tenantId, id) {
      await tenantDb.run(tenantId, async (tx) => {
        const row = await tx.notification.findFirst({
          where: { id, tenantId },
          select: { attempts: true },
        });
        if (!row) {
          return;
        }
        await tx.notification.updateMany({
          where: { id, tenantId, status: "SENT" },
          data: { status: row.attempts >= 3 ? "FAILED" : "PENDING" },
        });
      });
    },
  };
}
