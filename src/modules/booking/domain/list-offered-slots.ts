import { MINUTES_IN_DAY, SLOT_STEP_MINUTES, minutesToTime, timeToMinutes } from "./time";

export type CapacityBand = {
  startTime: string;
  endTime: string;
  capacity: number;
};

export type MinuteInterval = {
  start: number;
  end: number;
};

export type ListOfferedSlotsInput = {
  localDate: string;
  todayLocalDate: string;
  nowMinuteOfDay: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  earliestStart: string | null;
  latestStart: string | null;
  professionalBands: CapacityBand[];
  branchBands: CapacityBand[];
  blocks: MinuteInterval[];
  professionalOccupations: MinuteInterval[];
  branchOccupations: MinuteInterval[];
};

function toBand(band: CapacityBand): { start: number; end: number; capacity: number } {
  return {
    start: timeToMinutes(band.startTime),
    end: timeToMinutes(band.endTime),
    capacity: band.capacity,
  };
}

function mergeCoverage(bands: { start: number; end: number }[]): { start: number; end: number }[] {
  const sorted = [...bands].sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: { start: number; end: number }[] = [];
  for (const band of sorted) {
    const last = merged[merged.length - 1];
    if (last && band.start <= last.end) {
      last.end = Math.max(last.end, band.end);
    } else {
      merged.push({ start: band.start, end: band.end });
    }
  }
  return merged;
}

function isCovered(
  start: number,
  end: number,
  coverage: { start: number; end: number }[],
): boolean {
  return coverage.some((span) => span.start <= start && span.end >= end);
}

function overlaps(left: MinuteInterval, right: MinuteInterval): boolean {
  return left.start < right.end && right.start < left.end;
}

function capacityAt(
  minute: number,
  bands: { start: number; end: number; capacity: number }[],
): number {
  const band = bands.find((item) => item.start <= minute && minute < item.end);
  return band?.capacity ?? 0;
}

function fitsCapacity(
  start: number,
  end: number,
  professional: { start: number; end: number; capacity: number }[],
  branch: { start: number; end: number; capacity: number }[],
  professionalOccupations: MinuteInterval[],
  branchOccupations: MinuteInterval[],
): boolean {
  const points = new Set<number>([start, end]);
  for (const band of [...professional, ...branch]) {
    if (band.start > start && band.start < end) {
      points.add(band.start);
    }
    if (band.end > start && band.end < end) {
      points.add(band.end);
    }
  }
  for (const occupation of [...professionalOccupations, ...branchOccupations]) {
    if (occupation.start > start && occupation.start < end) {
      points.add(occupation.start);
    }
    if (occupation.end > start && occupation.end < end) {
      points.add(occupation.end);
    }
  }

  const sorted = [...points].sort((left, right) => left - right);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    if (from === undefined || to === undefined || to <= start || from >= end) {
      continue;
    }
    const professionalCapacity = capacityAt(from, professional);
    const branchCapacity = capacityAt(from, branch);
    if (professionalCapacity < 1 || branchCapacity < 1) {
      return false;
    }
    const professionalTaken = professionalOccupations.filter(
      (item) => item.start <= from && item.end > from,
    ).length;
    if (professionalTaken + 1 > professionalCapacity) {
      return false;
    }
    const branchTaken = branchOccupations.filter(
      (item) => item.start <= from && item.end > from,
    ).length;
    if (branchTaken + 1 > branchCapacity) {
      return false;
    }
  }
  return true;
}

export function listOfferedSlots(input: ListOfferedSlotsInput): string[] {
  if (input.localDate < input.todayLocalDate) {
    return [];
  }

  const totalMinutes = input.durationMinutes + input.prepMinutes + input.cleanupMinutes;
  if (totalMinutes <= 0) {
    return [];
  }

  const professional = input.professionalBands.map(toBand);
  const branch = input.branchBands.map(toBand);
  const professionalCoverage = mergeCoverage(professional);
  const branchCoverage = mergeCoverage(branch);
  const earliest = input.earliestStart ? timeToMinutes(input.earliestStart) : null;
  const latest = input.latestStart ? timeToMinutes(input.latestStart) : null;
  const isToday = input.localDate === input.todayLocalDate;

  const starts = new Set<number>();
  for (const band of professional) {
    for (let minute = band.start; minute < band.end; minute += SLOT_STEP_MINUTES) {
      starts.add(minute);
    }
  }

  const offered: string[] = [];
  for (const start of [...starts].sort((left, right) => left - right)) {
    const end = start + totalMinutes;
    if (end > MINUTES_IN_DAY) {
      continue;
    }
    if (earliest !== null && start < earliest) {
      continue;
    }
    if (latest !== null && start > latest) {
      continue;
    }
    if (isToday && start <= input.nowMinuteOfDay) {
      continue;
    }
    if (!isCovered(start, end, professionalCoverage) || !isCovered(start, end, branchCoverage)) {
      continue;
    }
    if (input.blocks.some((block) => overlaps({ start, end }, block))) {
      continue;
    }
    if (
      !fitsCapacity(
        start,
        end,
        professional,
        branch,
        input.professionalOccupations,
        input.branchOccupations,
      )
    ) {
      continue;
    }
    offered.push(minutesToTime(start));
  }
  return offered;
}
