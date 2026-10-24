import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calendarMonthWindow,
  planAppointmentNotices,
} from "@/modules/notifications/domain/notices";
import { createScheduleAppointmentNotices } from "@/modules/notifications/application/use-cases/schedule-notices";
import { createDispatchDueNotices } from "@/modules/notifications/application/use-cases/dispatch-notices";
import type { NoticeStore } from "@/modules/notifications/application/ports/notice-store";
import type { NoticeKind } from "@/modules/notifications/domain/notices";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const now = new Date("2026-09-10T12:00:00.000Z");

function memoryStore(): NoticeStore & {
  quotas: Map<string, { cap: number; timeZone: string }>;
  rows: {
    tenantId: string;
    appointmentId: string;
    kind: NoticeKind;
    status: string;
    sendAt: Date;
    idempotencyKey: string;
  }[];
} {
  const rows: {
    id: string;
    tenantId: string;
    appointmentId: string;
    kind: NoticeKind;
    status: string;
    sendAt: Date;
    idempotencyKey: string;
    phone: string;
    businessName: string;
    localDate: string;
    localTime: string;
    serviceName: string;
    attempts: number;
  }[] = [];
  let seq = 0;
  const quotas = new Map<string, { cap: number; timeZone: string }>();
  return {
    rows,
    quotas,
    async replacePending(input) {
      for (const row of rows) {
        if (
          row.tenantId === input.tenantId &&
          row.appointmentId === input.appointmentId &&
          row.status === "PENDING"
        ) {
          row.status = "CANCELLED";
        }
      }
      for (const row of input.rows) {
        seq += 1;
        rows.push({
          id: `n-${seq}`,
          tenantId: input.tenantId,
          appointmentId: input.appointmentId,
          kind: row.kind,
          status: "PENDING",
          sendAt: row.sendAt,
          idempotencyKey: row.idempotencyKey,
          phone: input.phone,
          businessName: input.businessName,
          localDate: input.localDate,
          localTime: input.localTime,
          serviceName: input.serviceName,
          attempts: 0,
        });
      }
    },
    async cancelPending(tenantId, appointmentId) {
      for (const row of rows) {
        if (
          row.tenantId === tenantId &&
          row.appointmentId === appointmentId &&
          row.status === "PENDING"
        ) {
          row.status = "CANCELLED";
        }
      }
    },
    async listTenantIds() {
      return [...new Set(rows.map((row) => row.tenantId))];
    },
    async quota(tenantId) {
      return quotas.get(tenantId) ?? { cap: 1000, timeZone: "UTC" };
    },
    async listDue(tenantId, at) {
      return rows
        .filter((row) => row.tenantId === tenantId && row.status === "PENDING" && row.sendAt <= at)
        .map((row) => ({ ...row, businessPhone: "el negocio" }));
    },
    async countSent(tenantId, from, to) {
      return rows.filter(
        (row) =>
          row.tenantId === tenantId &&
          row.status === "SENT" &&
          row.sendAt >= from &&
          row.sendAt < to,
      ).length;
    },
    async claim(tenantId, id) {
      const row = rows.find(
        (item) => item.id === id && item.tenantId === tenantId && item.status === "PENDING",
      );
      if (!row) {
        return false;
      }
      row.status = "SENT";
      row.attempts += 1;
      return true;
    },
    async markRetry(tenantId, id) {
      const row = rows.find((item) => item.id === id && item.tenantId === tenantId);
      if (!row) {
        return;
      }
      row.status = row.attempts >= 3 ? "FAILED" : "PENDING";
    },
  };
}

describe("avisos de un turno", () => {
  it("escribe confirmación y recordatorio, y al cancelar no deja pendientes", async () => {
    const store = memoryStore();
    const schedule = createScheduleAppointmentNotices(store);
    await schedule({
      tenantId: tenantA,
      appointmentId: "appt-a",
      startsAt: new Date("2026-09-12T15:00:00.000Z"),
      localDate: "2026-09-12",
      localTime: "12:00",
      phone: "+5491112345678",
      businessName: "Ana",
      serviceName: "Corte",
      now,
    });
    const planned = planAppointmentNotices({
      appointmentId: "appt-a",
      startsAt: new Date("2026-09-12T15:00:00.000Z"),
      localDate: "2026-09-12",
      localTime: "12:00",
      now,
    });
    assert.equal(planned.length, 2);
    assert.equal(store.rows.filter((row) => row.status === "PENDING").length, 2);
    await schedule.cancel({ tenantId: tenantA, appointmentId: "appt-a" });
    assert.equal(store.rows.filter((row) => row.status === "PENDING").length, 0);
  });

  it("no cancela los avisos de otro negocio", async () => {
    const store = memoryStore();
    const schedule = createScheduleAppointmentNotices(store);
    await schedule({
      tenantId: tenantB,
      appointmentId: "appt-b",
      startsAt: new Date("2026-09-12T15:00:00.000Z"),
      localDate: "2026-09-12",
      localTime: "12:00",
      phone: "+5491188888888",
      businessName: "Otro",
      serviceName: "Corte",
      now,
    });
    await schedule.cancel({ tenantId: tenantA, appointmentId: "appt-b" });
    assert.equal(
      store.rows.filter((row) => row.tenantId === tenantB && row.status === "PENDING").length,
      2,
    );
  });

  it("manda cada aviso una sola vez", async () => {
    const store = memoryStore();
    const schedule = createScheduleAppointmentNotices(store);
    await schedule({
      tenantId: tenantA,
      appointmentId: "appt-a",
      startsAt: now,
      localDate: "2026-09-10",
      localTime: "12:00",
      phone: "+5491112345678",
      businessName: "Ana",
      serviceName: "Corte",
      now,
    });
    let sent = 0;
    const dispatch = createDispatchDueNotices(store, {
      async send() {
        sent += 1;
        return { providerMessageId: "m1" };
      },
    });
    await dispatch(now);
    await dispatch(now);
    assert.equal(sent, 1);
    assert.equal(
      await store.countSent(
        tenantA,
        new Date("2026-09-01T00:00:00.000Z"),
        new Date("2026-10-01T00:00:00.000Z"),
      ),
      1,
    );
    assert.equal(
      await store.countSent(
        tenantB,
        new Date("2026-09-01T00:00:00.000Z"),
        new Date("2026-10-01T00:00:00.000Z"),
      ),
      0,
    );
  });

  it("no manda cuando el negocio llegó al tope del mes y el otro sigue", async () => {
    const window = calendarMonthWindow(now, "America/Argentina/Buenos_Aires");
    assert.equal(window.from.toISOString(), "2026-09-01T03:00:00.000Z");
    assert.equal(window.to.toISOString(), "2026-10-01T03:00:00.000Z");

    const store = memoryStore();
    store.quotas.set(tenantA, { cap: 1, timeZone: "America/Argentina/Buenos_Aires" });
    store.quotas.set(tenantB, { cap: 300, timeZone: "America/Argentina/Buenos_Aires" });
    const schedule = createScheduleAppointmentNotices(store);
    await schedule({
      tenantId: tenantA,
      appointmentId: "appt-a",
      startsAt: now,
      localDate: "2026-09-10",
      localTime: "09:00",
      phone: "+5491112345678",
      businessName: "Ana",
      serviceName: "Corte",
      now,
    });
    await schedule({
      tenantId: tenantB,
      appointmentId: "appt-b",
      startsAt: now,
      localDate: "2026-09-10",
      localTime: "09:00",
      phone: "+5491188888888",
      businessName: "Otro",
      serviceName: "Corte",
      now,
    });
    store.rows.push({
      tenantId: tenantA,
      appointmentId: "prev",
      kind: "CONFIRMATION",
      status: "SENT",
      sendAt: now,
      idempotencyKey: "prev",
    });
    const sentTo: string[] = [];
    const dispatch = createDispatchDueNotices(store, {
      async send(input) {
        sentTo.push(input.toPhone);
        return { providerMessageId: "m" };
      },
    });
    await dispatch(now);
    assert.deepEqual(sentTo, ["+5491188888888"]);
  });
});
