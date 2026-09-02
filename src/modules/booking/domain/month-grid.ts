/** Grilla de mes alineada a lunes (lun–dom). Sin I/O. */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export const WEEK_DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export type MonthCell = { day: number; inMonth: boolean; dateKey: string };

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function isYearMonth(value: string): boolean {
  const match = YEAR_MONTH_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

/** `month`: 1–12. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDow = first.getUTCDay();
  const mondayOffset = startDow === 0 ? 6 : startDow - 1;

  const prevLast = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const pm = month === 1 ? 12 : month - 1;
  const py = month === 1 ? year - 1 : year;

  const cells: MonthCell[] = [];

  for (let i = 0; i < mondayOffset; i += 1) {
    const d = prevLast - mondayOffset + i + 1;
    cells.push({
      day: d,
      inMonth: false,
      dateKey: `${py}-${pad2(pm)}-${pad2(d)}`,
    });
  }
  for (let d = 1; d <= lastDay; d += 1) {
    cells.push({
      day: d,
      inMonth: true,
      dateKey: `${year}-${pad2(month)}-${pad2(d)}`,
    });
  }
  let nextM = month + 1;
  let nextY = year;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  let dNext = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      day: dNext,
      inMonth: false,
      dateKey: `${nextY}-${pad2(nextM)}-${pad2(dNext)}`,
    });
    dNext += 1;
  }

  return cells;
}

export function monthTitle(year: number, month: number): string {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

export function yearMonthFromDate(localDate: string): string {
  return localDate.slice(0, 7);
}

export function monthDateRange(yearMonth: string): {
  fromDate: string;
  toDate: string;
  year: number;
  month: number;
} {
  if (!isYearMonth(yearMonth)) {
    throw new Error("INVALID_YEAR_MONTH");
  }
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    fromDate: `${yearMonth}-01`,
    toDate: `${yearMonth}-${pad2(lastDay)}`,
  };
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const { year, month } = monthDateRange(yearMonth);
  const date = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function blockOverlapsDate(
  block: { startDate: string; endDate: string },
  localDate: string,
): boolean {
  return block.startDate <= localDate && block.endDate >= localDate;
}

export function isCancelledOrNoShow(status: string): boolean {
  return status === "CANCELLED" || status === "NO_SHOW";
}
