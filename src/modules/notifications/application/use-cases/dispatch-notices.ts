import { calendarMonthWindow } from "@/modules/notifications/domain/notices";

import type { MessageSender, NoticeStore } from "../ports/notice-store";

export function createDispatchDueNotices(store: NoticeStore, sender: MessageSender) {
  return async function dispatchDueNotices(now: Date): Promise<number> {
    const tenantIds = await store.listTenantIds();
    let sent = 0;
    for (const tenantId of tenantIds) {
      const quota = await store.quota(tenantId);
      const window = calendarMonthWindow(now, quota.timeZone);
      const already = await store.countSent(tenantId, window.from, window.to);
      let room = quota.cap - already;
      if (room <= 0) {
        continue;
      }
      const due = await store.listDue(tenantId, now);
      for (const notice of due) {
        if (room <= 0) {
          break;
        }
        const claimed = await store.claim(tenantId, notice.id);
        if (!claimed) {
          continue;
        }
        try {
          await sender.send({
            toPhone: notice.phone,
            kind: notice.kind,
            businessName: notice.businessName,
            localDate: notice.localDate,
            localTime: notice.localTime,
            serviceName: notice.serviceName,
            businessPhone: notice.businessPhone,
          });
          sent += 1;
          room -= 1;
        } catch {
          await store.markRetry(tenantId, notice.id);
        }
      }
    }
    return sent;
  };
}
