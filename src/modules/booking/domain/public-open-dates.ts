import { listOfferedSlots } from "./list-offered-slots";
import { addLocalDays, dayOfWeekFromLocalDate, timeToMinutes } from "./time";

export const PUBLIC_HORIZON_DAYS = 30;

export type PublicDayWindow = {
  professionalId: string;
  branchId: string;
  isActive: boolean;
  professionalBands: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }[];
  branchBands: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }[];
  blocks: {
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
  }[];
};

export type PublicDayService = {
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  isActive: boolean;
};

export type PublicDayOccupation = {
  professionalId: string;
  branchId: string;
  localDate: string;
  localTime: string;
  durationMinutes: number;
};

function blockIntervals(blocks: PublicDayWindow["blocks"], localDate: string) {
  const intervals: { start: number; end: number }[] = [];
  for (const block of blocks) {
    if (block.startDate > localDate || block.endDate < localDate) {
      continue;
    }
    if (block.startTime && block.endTime) {
      intervals.push({ start: timeToMinutes(block.startTime), end: timeToMinutes(block.endTime) });
    } else if (!block.startTime && !block.endTime) {
      intervals.push({ start: 0, end: 24 * 60 });
    }
  }
  return intervals;
}

function occupationsOn(
  occupations: PublicDayOccupation[],
  localDate: string,
  matches: (occupation: PublicDayOccupation) => boolean,
) {
  return occupations
    .filter((occupation) => occupation.localDate === localDate && matches(occupation))
    .map((occupation) => {
      const start = timeToMinutes(occupation.localTime);
      return { start, end: start + occupation.durationMinutes };
    });
}

function dayHasSlot(
  window: PublicDayWindow,
  localDate: string,
  today: string,
  nowMinuteOfDay: number,
  service: PublicDayService,
  occupations: PublicDayOccupation[],
): boolean {
  if (!window.isActive) {
    return false;
  }
  const dayOfWeek = dayOfWeekFromLocalDate(localDate);
  const slots = listOfferedSlots({
    localDate,
    todayLocalDate: today,
    nowMinuteOfDay,
    durationMinutes: service.durationMinutes,
    prepMinutes: service.prepMinutes,
    cleanupMinutes: service.cleanupMinutes,
    earliestStart: service.earliestStart,
    latestStart: service.latestStart,
    professionalBands: window.professionalBands.filter((band) => band.dayOfWeek === dayOfWeek),
    branchBands: window.branchBands.filter((band) => band.dayOfWeek === dayOfWeek),
    blocks: blockIntervals(window.blocks, localDate),
    professionalOccupations: occupationsOn(
      occupations,
      localDate,
      (occupation) => occupation.professionalId === window.professionalId,
    ),
    branchOccupations: occupationsOn(
      occupations,
      localDate,
      (occupation) => occupation.branchId === window.branchId,
    ),
  });
  return slots.length > 0;
}

/** Días del horizonte en los que el cálculo de huecos devuelve al menos un horario. */
export function publicBookableDates(input: {
  today: string;
  nowMinuteOfDay: number;
  service: PublicDayService | null;
  windows: PublicDayWindow[];
  occupations: PublicDayOccupation[];
}): string[] {
  if (!input.service?.isActive) {
    return [];
  }
  const service = input.service;
  const dates: string[] = [];
  for (let offset = 0; offset < PUBLIC_HORIZON_DAYS; offset += 1) {
    const localDate = addLocalDays(input.today, offset);
    const open = input.windows.some((window) =>
      dayHasSlot(window, localDate, input.today, input.nowMinuteOfDay, service, input.occupations),
    );
    if (open) {
      dates.push(localDate);
    }
  }
  return dates;
}
