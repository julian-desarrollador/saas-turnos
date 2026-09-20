import { listOfferedSlots } from "../domain/list-offered-slots";
import {
  SLOT_STEP_MINUTES,
  dayOfWeekFromLocalDate,
  timeToMinutes,
  zonedCivilNow,
} from "../domain/time";
import type {
  AvailabilitySnapshot,
  CalendarBlockWindow,
  ScheduleBand,
} from "./ports/availability-repository";

function bandsForDay(bands: ScheduleBand[], dayOfWeek: number) {
  return bands
    .filter((band) => band.dayOfWeek === dayOfWeek)
    .map((band) => ({
      startTime: band.startTime,
      endTime: band.endTime,
      capacity: band.capacity,
    }));
}

export type EmptySlotsReason =
  | "PAST_DATE"
  | "TODAY_ENDED"
  | "NO_PROFESSIONAL_HOURS"
  | "NO_BRANCH_HOURS"
  | "INACTIVE"
  | "BRANCH_BLOCKED"
  | "NONE_FIT";

function blockInterval(block: CalendarBlockWindow, localDate: string) {
  if (block.startDate > localDate || block.endDate < localDate) {
    return null;
  }
  if (block.startTime && block.endTime) {
    return { start: timeToMinutes(block.startTime), end: timeToMinutes(block.endTime) };
  }
  if (!block.startTime && !block.endTime) {
    return { start: 0, end: 24 * 60 };
  }
  return null;
}

export function occupancyMinutes(service: {
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
}): number {
  return service.durationMinutes + service.prepMinutes + service.cleanupMinutes;
}

export function offeredFromSnapshot(
  snapshot: AvailabilitySnapshot,
  localDate: string,
  now: Date,
): string[] {
  if (!snapshot.professional || !snapshot.service) {
    return [];
  }
  const civil = zonedCivilNow(snapshot.timezone, now);
  const dayOfWeek = dayOfWeekFromLocalDate(localDate);
  const blocks = snapshot.blocks
    .map((block) => blockInterval(block, localDate))
    .filter((interval): interval is { start: number; end: number } => interval !== null);

  return listOfferedSlots({
    localDate,
    todayLocalDate: civil.localDate,
    nowMinuteOfDay: civil.minuteOfDay,
    durationMinutes: snapshot.service.durationMinutes,
    prepMinutes: snapshot.service.prepMinutes,
    cleanupMinutes: snapshot.service.cleanupMinutes,
    earliestStart: snapshot.service.earliestStart,
    latestStart: snapshot.service.latestStart,
    professionalBands: bandsForDay(snapshot.professionalBands, dayOfWeek),
    branchBands: bandsForDay(snapshot.branchBands, dayOfWeek),
    blocks,
    professionalOccupations: snapshot.appointments.map((appointment) => {
      const start = timeToMinutes(appointment.localTime);
      return { start, end: start + appointment.durationMinutes };
    }),
    branchOccupations: snapshot.branchAppointments.map((appointment) => {
      const start = timeToMinutes(appointment.localTime);
      return { start, end: start + appointment.durationMinutes };
    }),
  });
}

export function emptySlotsReason(
  snapshot: AvailabilitySnapshot,
  localDate: string,
  now: Date,
): EmptySlotsReason | null {
  if (offeredFromSnapshot(snapshot, localDate, now).length > 0) {
    return null;
  }
  if (!snapshot.professional || !snapshot.service) {
    return "NONE_FIT";
  }
  if (!snapshot.professional.isActive || !snapshot.service.isActive) {
    return "INACTIVE";
  }

  const civil = zonedCivilNow(snapshot.timezone, now);
  if (localDate < civil.localDate) {
    return "PAST_DATE";
  }

  const dayOfWeek = dayOfWeekFromLocalDate(localDate);
  const professionalBands = bandsForDay(snapshot.professionalBands, dayOfWeek);
  const branchBands = bandsForDay(snapshot.branchBands, dayOfWeek);
  if (professionalBands.length === 0) {
    return "NO_PROFESSIONAL_HOURS";
  }
  if (branchBands.length === 0) {
    return "NO_BRANCH_HOURS";
  }

  if (localDate === civil.localDate) {
    const lastEnd = Math.max(...professionalBands.map((band) => timeToMinutes(band.endTime)));
    if (civil.minuteOfDay >= lastEnd) {
      return "TODAY_ENDED";
    }
    const hasFutureStart = professionalBands.some((band) => {
      const start = timeToMinutes(band.startTime);
      const end = timeToMinutes(band.endTime);
      for (let minute = start; minute < end; minute += SLOT_STEP_MINUTES) {
        if (minute > civil.minuteOfDay) {
          return true;
        }
      }
      return false;
    });
    if (!hasFutureStart) {
      return "TODAY_ENDED";
    }
  }

  const hasFullDayBranchBlock = snapshot.blocks.some((block) => {
    if (block.owner !== "branch") {
      return false;
    }
    const interval = blockInterval(block, localDate);
    return interval !== null && interval.start === 0 && interval.end === 24 * 60;
  });
  if (hasFullDayBranchBlock) {
    return "BRANCH_BLOCKED";
  }

  return "NONE_FIT";
}
