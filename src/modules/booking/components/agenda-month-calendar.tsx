import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonthCell } from "@/modules/booking/domain/month-grid";
import { WEEK_DAY_LETTERS } from "@/modules/booking/domain/month-grid";

export function AgendaMonthCalendar({
  monthLabel,
  selectedDate,
  grid,
  activeDates,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  monthNavDisabled = false,
  minSelectableDate,
}: {
  monthLabel: string;
  selectedDate: string;
  grid: MonthCell[];
  activeDates: string[];
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthNavDisabled?: boolean;
  /** Si está definido, los días anteriores no se pueden elegir (p. ej. alta de turno). */
  minSelectableDate?: string;
}) {
  const active = new Set(activeDates);

  return (
    <section className="bg-card rounded-2xl border p-4 shadow-sm">
      <div className="relative mb-3 flex items-center justify-center px-10">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={monthNavDisabled}
          className="text-muted-foreground hover:bg-muted absolute left-0 flex size-9 items-center justify-center rounded-xl disabled:opacity-50"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-center text-sm font-semibold tracking-tight capitalize">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={monthNavDisabled}
          className="text-muted-foreground hover:bg-muted absolute right-0 flex size-9 items-center justify-center rounded-xl disabled:opacity-50"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide">
        {WEEK_DAY_LETTERS.map((letter) => (
          <div key={letter} className="py-2">
            {letter}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {grid.map((cell) => {
          const selected = cell.dateKey === selectedDate;
          const disabled = Boolean(minSelectableDate && cell.dateKey < minSelectableDate);
          return (
            <button
              key={`${cell.dateKey}-${cell.inMonth ? "in" : "out"}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(cell.dateKey)}
              className={cn(
                "flex w-full flex-col items-center py-1",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm leading-none font-semibold transition",
                  cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                  disabled && "text-muted-foreground/40 line-through",
                  selected && !disabled && "bg-primary text-primary-foreground shadow-sm",
                )}
              >
                {cell.day}
              </span>
              <span className="mt-0.5 flex h-2 items-center justify-center">
                {!disabled && active.has(cell.dateKey) ? (
                  <span className="bg-primary block size-1.5 rounded-full" />
                ) : (
                  <span className="block size-1.5 rounded-full bg-transparent" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
