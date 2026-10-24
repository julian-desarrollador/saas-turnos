"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { publicTheme as t, type PublicAccent } from "@/components/shared/public-template";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  monthDateRange,
  monthTitle,
  shiftYearMonth,
  yearMonthFromDate,
} from "@/modules/booking/domain/month-grid";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function PublicDayCalendar({
  openDays,
  selected,
  accent,
  onSelect,
}: {
  openDays: string[];
  selected: string;
  accent: PublicAccent;
  onSelect: (day: string) => void;
}) {
  const firstMonth = openDays[0] ? yearMonthFromDate(openDays[0]) : "";
  const lastMonth = openDays.at(-1) ? yearMonthFromDate(openDays.at(-1) ?? "") : firstMonth;
  const [month, setMonth] = useState(firstMonth);
  if (!month) {
    return <p className={cn("text-sm", t.muted)}>No hay días con horario en el próximo mes.</p>;
  }
  const { year, month: monthNumber } = monthDateRange(month);
  const open = new Set(openDays);
  const grid = buildMonthGrid(year, monthNumber);
  const today = todayKey();

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e7e0d5]/80 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={month <= firstMonth}
          onClick={() => setMonth(shiftYearMonth(month, -1))}
          className="rounded-lg p-1.5 text-[#7f7c7a] transition-colors hover:bg-[#f3f0eb] disabled:opacity-30"
        >
          <ChevronLeft className="size-5" strokeWidth={1.8} />
        </button>
        <h2
          className={cn(
            "text-xl leading-none font-semibold text-[#1c1b1b] first-letter:uppercase",
            t.display,
          )}
        >
          {monthTitle(year, monthNumber)}
        </h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={month >= lastMonth}
          onClick={() => setMonth(shiftYearMonth(month, 1))}
          className="rounded-lg p-1.5 text-[#7f7c7a] transition-colors hover:bg-[#f3f0eb] disabled:opacity-30"
        >
          <ChevronRight className="size-5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-3 text-center">
        {WEEKDAYS.map((label) => (
          <div key={label} className="text-[11px] font-medium tracking-wide text-[#9797a0]">
            {label}
          </div>
        ))}
        {grid.map((cell) => {
          const enabled = cell.inMonth && open.has(cell.dateKey);
          const isSelected = cell.dateKey === selected;
          const isToday = cell.dateKey === today;
          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={!enabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.dateKey)}
              className={cn(
                "mx-auto flex size-10 items-center justify-center rounded-xl text-sm font-medium transition-all",
                !cell.inMonth && "text-[#d8d4cc]",
                cell.inMonth && !enabled && "text-[#c4c0b8]",
                enabled && !isSelected && isToday && "bg-[#eceae6] text-[#1c1b1b]",
                enabled &&
                  !isSelected &&
                  !isToday &&
                  "border border-[#ddd9d2] bg-white text-[#1c1b1b] hover:bg-[#f3f0eb]",
                isSelected && cn(accent.solid, accent.glow),
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </section>
  );
}
