import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import type { MonthAppointment } from "@/modules/booking/application/use-cases/list-month-agenda";
import { AgendaAppointmentCard } from "@/modules/booking/components/agenda-appointment-card";
import { AgendaBlockCard } from "@/modules/booking/components/agenda-block-card";

function formatDayHeading(localDate: string): { weekday: string; dayLong: string } {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  const instant = new Date(Date.UTC(year, month - 1, day, 12));
  return {
    weekday: new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(instant),
    dayLong: new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(instant),
  };
}

export function AgendaDayPanel({
  slug,
  date,
  showCancelled,
  cancelledCount,
  eventCount,
  appointments,
  blocks,
  canWrite,
  loading = false,
  onToggleCancelled,
}: {
  slug: string;
  date: string;
  showCancelled: boolean;
  cancelledCount: number;
  eventCount: number;
  appointments: MonthAppointment[];
  blocks: MonthBlockRecord[];
  canWrite: boolean;
  loading?: boolean;
  onToggleCancelled: () => void;
}) {
  const { weekday, dayLong } = formatDayHeading(date);
  const cancelledLabel = cancelledCount === 1 ? "Cancelada" : "Canceladas";

  type DayRow =
    | { kind: "appointment"; sort: string; appointment: MonthAppointment }
    | { kind: "block"; sort: string; block: MonthBlockRecord };

  const rows: DayRow[] = [
    ...appointments.map((appointment) => ({
      kind: "appointment" as const,
      sort: `${appointment.localTime}-${appointment.id}`,
      appointment,
    })),
    ...blocks.map((block) => ({
      kind: "block" as const,
      sort: `${block.startTime ?? "00:00"}-${block.id}`,
      block,
    })),
  ].sort((left, right) => left.sort.localeCompare(right.sort));

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl leading-tight font-bold tracking-tight capitalize">{weekday}</p>
          <p className="text-muted-foreground mt-0.5 text-sm capitalize">{dayLong}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onToggleCancelled}
            className={cn(
              "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm transition",
              showCancelled
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
            aria-pressed={showCancelled}
          >
            <span className="font-semibold">{cancelledCount}</span>
            <span className="font-semibold">{cancelledLabel}</span>
          </button>
          <div className="border-border bg-card text-muted-foreground flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm">
            <CalendarDays className="text-primary size-4" />
            <span className="font-semibold">
              {eventCount} {eventCount === 1 ? "evento" : "eventos"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando agenda…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay turnos ni bloqueos este día.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((row) => {
            if (row.kind === "block") {
              return (
                <li key={`block-${row.block.id}`}>
                  <AgendaBlockCard slug={slug} block={row.block} />
                </li>
              );
            }

            return (
              <li key={row.appointment.id}>
                <AgendaAppointmentCard
                  slug={slug}
                  date={date}
                  appointment={row.appointment}
                  canWrite={canWrite}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
