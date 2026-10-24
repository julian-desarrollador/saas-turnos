import { planAppointmentNotices } from "@/modules/notifications/domain/notices";

import type { NoticeStore } from "../ports/notice-store";

export function createScheduleAppointmentNotices(store: NoticeStore) {
  async function schedule(input: {
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
    const rows = planAppointmentNotices(input);
    await store.replacePending({ ...input, rows });
  }

  schedule.cancel = async function cancel(input: { tenantId: string; appointmentId: string }) {
    await store.cancelPending(input.tenantId, input.appointmentId);
  };

  return schedule;
}
