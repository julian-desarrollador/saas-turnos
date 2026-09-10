import { assertPermission } from "@/core/authorization";

import { isYearMonth, monthDateRange } from "../../domain/month-grid";
import { BookingError } from "../errors";
import type {
  AvailabilityRepository,
  BookingActor,
  MonthAppointmentRecord,
  MonthBlockRecord,
} from "../ports/availability-repository";
import { occupancyEndTime } from "./list-day-appointments";

export type MonthAppointment = MonthAppointmentRecord & {
  endTime: string;
};

export type MonthAgenda = {
  yearMonth: string;
  fromDate: string;
  toDate: string;
  appointments: MonthAppointment[];
  blocks: MonthBlockRecord[];
};

export function createListMonthAgenda(repo: AvailabilityRepository) {
  return async function listMonthAgenda(input: {
    actor: BookingActor;
    yearMonth: string;
  }): Promise<MonthAgenda> {
    assertPermission(input.actor.role, "booking.read");
    if (!isYearMonth(input.yearMonth)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "yearMonth");
    }

    const { fromDate, toDate } = monthDateRange(input.yearMonth);
    const [appointments, blocks] = await Promise.all([
      repo.listMonthAppointments(input.actor.tenantId, fromDate, toDate),
      repo.listMonthBlocks(input.actor.tenantId, fromDate, toDate),
    ]);

    return {
      yearMonth: input.yearMonth,
      fromDate,
      toDate,
      appointments: appointments.map((row) => ({
        ...row,
        endTime: occupancyEndTime(row.localTime, row.durationMinutes),
      })),
      blocks,
    };
  };
}

export {
  appointmentDotDates,
  blockDotDates,
  cancelledCountOnDay,
  dayAppointments,
  dayBlocks,
} from "../../domain/month-agenda-view";
