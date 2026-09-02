import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryAvailabilityRepository } from "@/modules/booking/adapters/outbound/memory-availability-repository";
import type { AvailabilitySnapshot } from "@/modules/booking/application/ports/availability-repository";
import { createListMonthAgenda } from "@/modules/booking/application/use-cases/list-month-agenda";
import {
  activityDates,
  cancelledCountOnDay,
  dayAppointments,
  dayBlocks,
} from "@/modules/booking/domain/month-agenda-view";
import { buildMonthGrid, isYearMonth, monthDateRange } from "@/modules/booking/domain/month-grid";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const professionalA = "11111111-1111-1111-1111-111111111111";
const professionalB = "44444444-4444-4444-4444-444444444444";
const serviceA = "22222222-2222-2222-2222-222222222222";
const actor = { tenantId: tenantA, role: "RECEPTION" as const };

function snapshot(): AvailabilitySnapshot {
  return {
    timezone: "America/Argentina/Buenos_Aires",
    professional: {
      id: professionalA,
      displayName: "Ana",
      branchId: "branch",
      serviceIds: [serviceA],
      isActive: true,
    },
    service: {
      id: serviceA,
      name: "Corte de dama",
      durationMinutes: 45,
      prepMinutes: 0,
      cleanupMinutes: 5,
      earliestStart: null,
      latestStart: null,
      isActive: true,
      priceAmount: 8000,
    },
    professionalBands: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", capacity: 1 }],
    branchBands: [{ dayOfWeek: 1, startTime: "09:00", endTime: "19:00", capacity: 3 }],
    blocks: [],
    appointments: [],
  };
}

describe("month-grid", () => {
  it("valida YYYY-MM y calcula el rango del mes", () => {
    assert.equal(isYearMonth("2026-08"), true);
    assert.equal(isYearMonth("2026-13"), false);
    const range = monthDateRange("2026-08");
    assert.equal(range.fromDate, "2026-08-01");
    assert.equal(range.toDate, "2026-08-31");
  });

  it("arma una grilla lun–dom", () => {
    const grid = buildMonthGrid(2026, 8);
    assert.equal(grid[0]?.dateKey, "2026-07-27");
    assert.equal(grid.find((cell) => cell.dateKey === "2026-08-31")?.inMonth, true);
  });
});

describe("listMonthAgenda", () => {
  it("lista turnos de todos los profesionales del mes, incluidos cancelados", async () => {
    const repo = createMemoryAvailabilityRepository({
      snapshot: snapshot(),
      professionals: [
        {
          id: professionalA,
          displayName: "Ana",
          branchId: "branch",
          serviceIds: [serviceA],
          isActive: true,
        },
        {
          id: professionalB,
          displayName: "Bruno",
          branchId: "branch",
          serviceIds: [serviceA],
          isActive: true,
        },
      ],
      dayAppointments: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-08-10",
          localTime: "10:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte",
          clientFirstName: "Lucía",
          clientLastName: null,
          clientPhone: "+5491111111111",
        },
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
          tenantId: tenantA,
          professionalId: professionalB,
          localDate: "2026-08-10",
          localTime: "11:00",
          durationMinutes: 50,
          status: "CANCELLED",
          serviceName: "Color",
          clientFirstName: "Mauro",
          clientLastName: null,
          clientPhone: "+5491122222222",
        },
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
          tenantId: tenantA,
          professionalId: professionalA,
          localDate: "2026-09-01",
          localTime: "10:00",
          durationMinutes: 50,
          status: "CONFIRMED",
          serviceName: "Corte",
          clientFirstName: "Otra",
          clientLastName: null,
          clientPhone: "+5491133333333",
        },
      ],
      monthBlocks: [
        {
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
          startDate: "2026-08-15",
          endDate: "2026-08-16",
          startTime: null,
          endTime: null,
          reason: "Feriado",
          professionalId: null,
          professionalName: null,
          branchId: "branch",
          branchName: "Centro",
        },
      ],
    });

    const listMonthAgenda = createListMonthAgenda(repo);
    const month = await listMonthAgenda({ actor, yearMonth: "2026-08" });
    assert.equal(month.appointments.length, 2);
    assert.equal(month.blocks.length, 1);
    assert.equal(
      month.appointments.some(
        (row) => row.professionalName === "Bruno" && row.status === "CANCELLED",
      ),
      true,
    );

    const dateKeys = buildMonthGrid(2026, 8).map((cell) => cell.dateKey);
    const dotsHidden = activityDates(month.appointments, month.blocks, false, dateKeys);
    assert.equal(dotsHidden.has("2026-08-10"), true);
    assert.equal(dotsHidden.has("2026-08-15"), true);
    assert.equal(dotsHidden.has("2026-08-16"), true);

    const visible = dayAppointments(month.appointments, "2026-08-10", false);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.professionalName, "Ana");

    const withCancelled = dayAppointments(month.appointments, "2026-08-10", true);
    assert.equal(withCancelled.length, 2);
    assert.equal(cancelledCountOnDay(month.appointments, "2026-08-10"), 1);

    const blocks = dayBlocks(month.blocks, "2026-08-15");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.reason, "Feriado");
  });
});
