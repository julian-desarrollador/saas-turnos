import "server-only";

import { createMetaCloudSender } from "@/modules/notifications/adapters/outbound/meta-cloud-sender";
import { createPrismaNoticeStore } from "@/modules/notifications/adapters/outbound/prisma-notice-store";
import { createDispatchDueNotices } from "@/modules/notifications/application/use-cases/dispatch-notices";
import { createScheduleAppointmentNotices } from "@/modules/notifications/application/use-cases/schedule-notices";
import { calendarMonthWindow } from "@/modules/notifications/domain/notices";
import { db, tenantDb } from "@/server/db";

function notices() {
  return createScheduleAppointmentNotices(createPrismaNoticeStore(db, tenantDb));
}

export async function scheduleBookingNotice(input: {
  tenantId: string;
  appointmentId: string;
  startsAt: Date;
  localDate: string;
  localTime: string;
  phone: string;
  businessName: string;
  serviceName: string;
  now: Date;
}): Promise<void> {
  try {
    await notices()(input);
  } catch (error) {
    console.error("No se pudo agendar el aviso", error);
  }
}

export async function cancelBookingNotice(tenantId: string, appointmentId: string): Promise<void> {
  try {
    await notices().cancel({ tenantId, appointmentId });
  } catch (error) {
    console.error("No se pudo cancelar el aviso", error);
  }
}

export async function messageUsage(
  tenantId: string,
  timeZone: string,
): Promise<{ sent: number; cap: number }> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { messageMonthlyCap: true },
  });
  const window = calendarMonthWindow(new Date(), timeZone);
  const sent = await createPrismaNoticeStore(db, tenantDb).countSent(
    tenantId,
    window.from,
    window.to,
  );
  return { sent, cap: tenant?.messageMonthlyCap ?? 80 };
}

export async function dispatchDueNotices(now: Date): Promise<number> {
  const dispatch = createDispatchDueNotices(
    createPrismaNoticeStore(db, tenantDb),
    createMetaCloudSender(),
  );
  return dispatch(now);
}
