import { CalendarDays, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import type { MonthAppointment } from "@/modules/booking/application/use-cases/list-month-agenda";
import { AgendaAppointmentCard } from "@/modules/booking/components/agenda-appointment-card";
import { AgendaBlockCard } from "@/modules/booking/components/agenda-block-card";
import type { DeferredAgendaKind } from "@/modules/booking/components/use-deferred-agenda-status";

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
  appointmentCount,
  blockCount,
  appointments,
  blocks,
  canWrite,
  loading = false,
  onToggleCancelled,
  onDeferStatus,
  onRemovedBlock,
}: {
  slug: string;
  date: string;
  showCancelled: boolean;
  cancelledCount: number;
  appointmentCount: number;
  blockCount: number;
  appointments: MonthAppointment[];
  blocks: MonthBlockRecord[];
  canWrite: boolean;
  loading?: boolean;
  onToggleCancelled: () => void;
  onDeferStatus?: (appointmentId: string, kind: DeferredAgendaKind) => void;
  onRemovedBlock: (blockId: string) => void;
}) {
  const { weekday, dayLong } = formatDayHeading(date);
  const cancelledLabel = cancelledCount === 1 ? "Cancelada" : "Canceladas";
  const empty = appointments.length === 0 && blocks.length === 0;

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
              "flex cursor-pointer items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm transition",
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
              {appointmentCount} {appointmentCount === 1 ? "turno" : "turnos"}
            </span>
          </div>
          {blockCount > 0 ? (
            <div className="border-border bg-card text-muted-foreground flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm">
              <Lock className="text-primary size-4" strokeWidth={2.2} />
              <span className="font-semibold">
                {blockCount} {blockCount === 1 ? "bloqueo" : "bloqueos"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando agenda…</p>
      ) : empty ? (
        <p className="text-muted-foreground text-sm">No hay turnos ni bloqueos este día.</p>
      ) : (
        <div className="grid gap-5">
          {appointments.length > 0 ? (
            <ul className="grid gap-3">
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  <AgendaAppointmentCard
                    slug={slug}
                    date={date}
                    appointment={appointment}
                    canWrite={canWrite}
                    onDeferStatus={
                      onDeferStatus
                        ? (kind) => {
                            onDeferStatus(appointment.id, kind);
                          }
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {blocks.length > 0 ? (
            <section className={cn("grid gap-2", appointments.length > 0 && "mt-8")}>
              <h2 className="text-muted-foreground flex items-center gap-1.5 text-base font-semibold">
                <Lock className="size-4" strokeWidth={2.2} />
                Bloqueos
              </h2>
              <ul className="grid gap-2">
                {blocks.map((block) => (
                  <li key={block.id}>
                    <AgendaBlockCard
                      slug={slug}
                      block={block}
                      canWrite={canWrite}
                      onRemoved={onRemovedBlock}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
