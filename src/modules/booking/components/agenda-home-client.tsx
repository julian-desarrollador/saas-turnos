"use client";

import { Lock, Plus, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchAgendaMonthAction, type AgendaMonthPayload } from "@/modules/booking";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import type { MonthAppointment } from "@/modules/booking/application/use-cases/list-month-agenda";
import { AgendaDayPanel } from "@/modules/booking/components/agenda-day-panel";
import { AgendaMonthCalendar } from "@/modules/booking/components/agenda-month-calendar";
import {
  activityDates,
  cancelledCountOnDay,
  dayAppointments,
  dayBlocks,
  selectedDateForMonth,
} from "@/modules/booking/domain/month-agenda-view";
import {
  buildMonthGrid,
  monthDateRange,
  monthTitle,
  shiftYearMonth,
  yearMonthFromDate,
} from "@/modules/booking/domain/month-grid";

export type AgendaHomeClientProps = {
  slug: string;
  tenantName: string;
  today: string;
  initialDate: string;
  initialMonth: string;
  initialShowCancelled: boolean;
  canWrite: boolean;
  appointments: MonthAppointment[];
  blocks: MonthBlockRecord[];
  booked: boolean;
  cancelled: boolean;
  rescheduled: boolean;
  noShow: boolean;
  completed: boolean;
};

export function AgendaHomeClient({
  slug,
  tenantName,
  today,
  initialDate,
  initialMonth,
  initialShowCancelled,
  canWrite,
  appointments: initialAppointments,
  blocks: initialBlocks,
  booked,
  cancelled,
  rescheduled,
  noShow,
  completed,
}: AgendaHomeClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [yearMonth, setYearMonth] = useState(initialMonth);
  const [showCancelled, setShowCancelled] = useState(initialShowCancelled);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [pending, startTransition] = useTransition();

  const { year, month } = monthDateRange(yearMonth);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = monthTitle(year, month);
  const dateKeys = useMemo(() => grid.map((cell) => cell.dateKey), [grid]);

  const activeDates = useMemo(
    () => [...activityDates(appointments, blocks, showCancelled, dateKeys)],
    [appointments, blocks, showCancelled, dateKeys],
  );

  const dayAppts = useMemo(
    () => dayAppointments(appointments, selectedDate, showCancelled),
    [appointments, selectedDate, showCancelled],
  );
  const dayBlk = useMemo(() => dayBlocks(blocks, selectedDate), [blocks, selectedDate]);
  const cancelledCount = useMemo(
    () => cancelledCountOnDay(appointments, selectedDate),
    [appointments, selectedDate],
  );

  const applyMonthPayload = useCallback((payload: AgendaMonthPayload, nextSelected: string) => {
    setYearMonth(payload.yearMonth);
    setAppointments(payload.appointments);
    setBlocks(payload.blocks);
    setSelectedDate(nextSelected);
  }, []);

  const loadMonth = useCallback(
    (nextMonth: string, preferredDate: string) => {
      const nextSelected = selectedDateForMonth(nextMonth, preferredDate, today);
      startTransition(async () => {
        const payload = await fetchAgendaMonthAction(slug, nextMonth);
        applyMonthPayload(payload, nextSelected);
      });
    },
    [applyMonthPayload, slug, today],
  );

  function onSelectDate(dateKey: string) {
    const targetMonth = yearMonthFromDate(dateKey);
    if (targetMonth === yearMonth) {
      setSelectedDate(dateKey);
      return;
    }
    loadMonth(targetMonth, dateKey);
  }

  function onPrevMonth() {
    loadMonth(shiftYearMonth(yearMonth, -1), selectedDate);
  }

  function onNextMonth() {
    loadMonth(shiftYearMonth(yearMonth, 1), selectedDate);
  }

  const addHref = `/${slug}/agenda/nuevo?date=${encodeURIComponent(selectedDate)}` as Route;
  const scheduleHref = `/${slug}/schedule` as Route;
  const clientsHref = `/${slug}/clients` as Route;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-2xl leading-tight font-bold">Agenda</h1>
        <p className="text-muted-foreground text-sm">{tenantName}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={addHref}
          className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-sm"
        >
          <Plus className="size-5" strokeWidth={2.2} />
          Agregar turno
        </Link>
        <Link
          href={scheduleHref}
          className="border-border bg-card text-foreground flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold"
        >
          <Lock className="size-5" strokeWidth={2.2} />
          Bloquear horario
        </Link>
      </div>
      <Link
        href={clientsHref}
        className="border-border bg-card text-foreground flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold shadow-sm"
      >
        <Users className="size-5" strokeWidth={2.2} />
        Clientes
      </Link>

      {booked ? <p className="text-sm font-medium">Turno confirmado.</p> : null}
      {cancelled ? <p className="text-sm font-medium">Turno cancelado.</p> : null}
      {rescheduled ? <p className="text-sm font-medium">Turno reprogramado.</p> : null}
      {noShow ? (
        <p className="text-sm font-medium">Ausencia registrada. El hueco volvió a liberarse.</p>
      ) : null}
      {completed ? <p className="text-sm font-medium">Turno marcado como atendido.</p> : null}

      <AgendaMonthCalendar
        monthLabel={monthLabel}
        selectedDate={selectedDate}
        grid={grid}
        activeDates={activeDates}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        monthNavDisabled={pending}
      />

      <AgendaDayPanel
        slug={slug}
        date={selectedDate}
        showCancelled={showCancelled}
        cancelledCount={cancelledCount}
        eventCount={dayAppts.length + dayBlk.length}
        appointments={dayAppts}
        blocks={dayBlk}
        canWrite={canWrite}
        loading={pending}
        onToggleCancelled={() => setShowCancelled((value) => !value)}
      />
    </main>
  );
}
