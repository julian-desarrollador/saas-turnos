"use client";

import { Lock, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchAgendaMonthAction, type AgendaMonthPayload } from "@/modules/booking";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import type { MonthAppointment } from "@/modules/booking/application/use-cases/list-month-agenda";
import { AgendaDayPanel } from "@/modules/booking/components/agenda-day-panel";
import {
  AgendaFeedbackToast,
  AgendaUndoToast,
} from "@/modules/booking/components/agenda-feedback-toast";
import { AgendaMonthCalendar } from "@/modules/booking/components/agenda-month-calendar";
import { useDeferredAgendaStatus } from "@/modules/booking/components/use-deferred-agenda-status";
import {
  appointmentDotDates,
  blockDotDates,
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
  blocked: boolean;
  blockWho: string | null;
  blockFrom: string | null;
  blockTo: string | null;
  blockStart: string | null;
  blockEnd: string | null;
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
  blocked,
  blockWho,
  blockFrom,
  blockTo,
  blockStart,
  blockEnd,
}: AgendaHomeClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [yearMonth, setYearMonth] = useState(initialMonth);
  const [showCancelled, setShowCancelled] = useState(initialShowCancelled);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [pending, startTransition] = useTransition();
  const { pendingById, undoToast, commitError, schedule, undo } = useDeferredAgendaStatus();

  const { year, month } = monthDateRange(yearMonth);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = monthTitle(year, month);
  const dateKeys = useMemo(() => grid.map((cell) => cell.dateKey), [grid]);

  const appointmentDates = useMemo(
    () => [...appointmentDotDates(appointments, showCancelled)],
    [appointments, showCancelled],
  );
  const blockDates = useMemo(() => [...blockDotDates(blocks, dateKeys)], [blocks, dateKeys]);

  const dayAppts = useMemo(() => {
    const base = dayAppointments(appointments, selectedDate, showCancelled);
    return base
      .filter((appointment) => pendingById[appointment.id] !== "noShow")
      .map((appointment) =>
        pendingById[appointment.id] === "completed"
          ? { ...appointment, status: "COMPLETED" as const }
          : appointment,
      );
  }, [appointments, selectedDate, showCancelled, pendingById]);
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

  const onRemovedBlock = useCallback((blockId: string) => {
    setBlocks((rows) => {
      if (!rows.some((row) => row.id === blockId)) {
        return rows;
      }
      return rows.filter((row) => row.id !== blockId);
    });
  }, []);

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
  const blockHref = `/${slug}/agenda/bloquear` as Route;

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
          href={blockHref}
          className="border-border bg-card text-foreground flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold"
        >
          <Lock className="size-5" strokeWidth={2.2} />
          Bloquear horario
        </Link>
      </div>

      <AgendaFeedbackToast
        booked={booked}
        cancelled={cancelled}
        rescheduled={rescheduled}
        noShow={noShow}
        completed={completed}
        blocked={blocked}
        blockedDetail={
          blocked
            ? {
                who: blockWho,
                from: blockFrom,
                to: blockTo,
                startTime: blockStart,
                endTime: blockEnd,
              }
            : null
        }
      />
      {undoToast ? (
        <AgendaUndoToast
          key={`${undoToast.kind}-${undoToast.appointmentId}`}
          kind={undoToast.kind}
          label={undoToast.label}
          onUndo={() => {
            undo(undoToast.appointmentId);
          }}
        />
      ) : null}
      {commitError ? (
        <p className="text-destructive text-sm" role="alert">
          {commitError}
        </p>
      ) : null}

      <AgendaMonthCalendar
        monthLabel={monthLabel}
        selectedDate={selectedDate}
        grid={grid}
        appointmentDates={appointmentDates}
        blockDates={blockDates}
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
        appointmentCount={dayAppts.length}
        blockCount={dayBlk.length}
        appointments={dayAppts}
        blocks={dayBlk}
        canWrite={canWrite}
        loading={pending}
        onToggleCancelled={() => setShowCancelled((value) => !value)}
        onRemovedBlock={onRemovedBlock}
        onDeferStatus={(appointmentId, kind) => {
          const appointment = appointments.find((item) => item.id === appointmentId);
          if (!appointment) {
            return;
          }
          const label =
            [appointment.clientFirstName, appointment.clientLastName]
              .filter((part): part is string => Boolean(part))
              .join(" ") || "Cliente";
          schedule({
            appointmentId,
            kind,
            slug,
            date: selectedDate,
            professionalId: appointment.professionalId,
            serviceId: "",
            label,
          });
        }}
      />
    </main>
  );
}
