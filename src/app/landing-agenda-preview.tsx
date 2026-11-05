import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Plus,
  Sparkles,
  User,
} from "lucide-react";

import { platformName } from "@/core/platform-brand";
import { cn } from "@/lib/utils";

/*
 * Vista previa de la agenda del panel para la portada (docs/22-marketing.md §12). Copia el diseño
 * de `/[slug]/panel/agenda` (agenda-month-calendar, agenda-day-panel y agenda-appointment-card)
 * con datos de ejemplo. Es estática: no toca la agenda real y no hace nada al tocarla.
 */

const TIME_ZONE = "America/Argentina/Buenos_Aires";
const WEEK_DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;
const BUSINESS = "Peluquería Demo";

type ExampleAppointment = {
  time: string;
  duration: string;
  client: string;
  service: string;
  professional: string;
  status: "confirmed" | "completed";
};

const APPOINTMENTS: readonly ExampleAppointment[] = [
  {
    time: "10:00",
    duration: "45 min",
    client: "Lucía Gómez",
    service: "Corte de dama",
    professional: "Ana",
    status: "completed",
  },
  {
    time: "11:30",
    duration: "1 h 30 min",
    client: "Martina Ruiz",
    service: "Coloración",
    professional: "Ana",
    status: "confirmed",
  },
  {
    time: "16:00",
    duration: "45 min",
    client: "Paula Díaz",
    service: "Corte de dama",
    professional: "Ana",
    status: "confirmed",
  },
];

/** Hoy en Argentina, como año, mes (1-12) y día. */
function todayInArgentina(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return {
    year: Number(parts.slice(0, 4)),
    month: Number(parts.slice(5, 7)),
    day: Number(parts.slice(8, 10)),
  };
}

/** Celdas del mes, con la semana empezando el lunes, como el calendario del panel. */
function monthCells(
  year: number,
  month: number,
): { day: number; inMonth: boolean; weekday: number }[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, 1 + index - lead));
    return {
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
      weekday: (date.getUTCDay() + 6) % 7,
    };
  });
}

/** Mayúscula solo en la primera letra: "noviembre de 2026" → "Noviembre de 2026". */
function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function AppointmentCard({ appointment }: { appointment: ExampleAppointment }) {
  const open = appointment.status === "confirmed";
  return (
    <article className="bg-card overflow-hidden rounded-[22px] border shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="bg-muted text-foreground rounded-full px-3.5 py-1.5 text-base leading-none font-semibold tracking-tight tabular-nums">
            {appointment.time}
          </span>
          <span className="text-muted-foreground shrink-0 text-[15px] font-semibold tracking-tight tabular-nums">
            {appointment.duration}
          </span>
        </div>
        <h3 className="mt-3 text-[22px] leading-tight font-bold break-words">
          {appointment.client}
        </h3>
        <p className="text-muted-foreground mt-2 flex items-start gap-2 text-sm leading-snug">
          <Sparkles className="text-primary mt-0.5 size-4 shrink-0" strokeWidth={1.85} />
          <span className="min-w-0">{appointment.service}</span>
        </p>
        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
          <User className="size-3.5 shrink-0" strokeWidth={1.75} />
          {appointment.professional}
        </p>
        <span className="text-primary mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium">
          <FileText className="size-3.5 shrink-0" strokeWidth={2} />
          Ver ficha
        </span>
        <div className="mt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
              open
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                : "bg-muted text-foreground",
            )}
          >
            <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
            {open ? "Confirmada" : "Atendido"}
          </span>
        </div>
      </div>

      {open ? (
        <div className="border-border border-t px-4 pt-3 pb-3.5">
          <span className="border-border bg-background flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 text-[15px] font-semibold">
            <CalendarClock className="size-5 shrink-0" strokeWidth={2} />
            Reprogramar
          </span>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <span className="border-border bg-background flex h-11 items-center justify-center rounded-xl border text-[15px] font-semibold shadow-xs">
              Atendido
            </span>
            <span className="border-border bg-background flex h-11 items-center justify-center rounded-xl border text-[15px] font-semibold shadow-xs">
              Ausente
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#128C7E]">
              <WhatsAppIcon className="size-4 shrink-0" />
              WhatsApp
            </span>
            <span className="text-muted-foreground text-[13px] font-medium">Cancelar</span>
          </div>
        </div>
      ) : (
        <div className="border-border border-t px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#128C7E]">
            <WhatsAppIcon className="size-4 shrink-0" />
            WhatsApp
          </span>
        </div>
      )}
    </article>
  );
}

export function LandingAgendaPreview() {
  const today = todayInArgentina();
  const cells = monthCells(today.year, today.month);
  const noon = new Date(Date.UTC(today.year, today.month - 1, today.day, 12));
  const monthLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(noon);
  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(
    noon,
  );
  const dayLong = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(noon);

  return (
    <section className="from-lp-surface via-lp-surface-container-low to-lp-surface pt-lp-space-xl relative w-full overflow-hidden bg-linear-to-b/srgb pb-24">
      <div className="px-lp-margin relative mx-auto max-w-[1240px]">
        <div className="relative mx-auto mt-6 w-full max-w-5xl">
          {/* Recordatorio de WhatsApp: el aviso que el producto manda 24 horas antes */}
          <div className="bg-lp-surface-container-lowest rounded-lp-xl p-lp-space-md gap-lp-space-sm absolute -bottom-8 left-4 z-20 flex max-w-sm items-start border-2 border-emerald-400/40 shadow-2xl sm:left-12">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md">
              <WhatsAppIcon className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lp-label-md text-lp-on-surface truncate font-bold">
                  {platformName}
                </span>
                <span className="text-lp-label-sm text-lp-on-surface-variant">Ahora</span>
              </div>
              <p className="text-lp-body-sm text-lp-on-surface mt-0.5">
                Recordatorio: mañana tenés turno en <span className="font-bold">{BUSINESS}</span> a
                las <span className="font-bold">11:30 hs</span> para Coloración. No respondas este
                mensaje: si necesitás cambiarlo, escribile al negocio.
              </p>
            </div>
          </div>

          {/* Ventana del panel */}
          <div className="bg-background text-foreground rounded-lp-2xl overflow-hidden border shadow-[0_20px_50px_-10px_rgba(15,23,42,0.18)]">
            <div className="bg-muted px-lp-space-md flex items-center gap-2 border-b py-3">
              <div className="h-3 w-3 rounded-full bg-rose-400"></div>
              <div className="h-3 w-3 rounded-full bg-amber-400"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
              <span className="text-muted-foreground ml-2 truncate text-xs">
                {platformName.toLowerCase()}.app/demo/panel/agenda
              </span>
            </div>

            <div className="grid gap-5 p-5 pb-16 sm:p-6 sm:pb-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <header className="grid gap-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
                    Panel
                  </p>
                  <p className="text-2xl leading-tight font-bold">Agenda</p>
                  <p className="text-muted-foreground text-sm">{BUSINESS}</p>
                </header>
                <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
                  <span className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-sm">
                    <Plus className="size-5" strokeWidth={2.2} />
                    Agregar turno
                  </span>
                  <span className="border-border bg-card text-foreground flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold">
                    <Lock className="size-5" strokeWidth={2.2} />
                    Bloquear horario
                  </span>
                </div>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* Calendario del mes */}
                <div className="bg-card rounded-2xl border p-4 shadow-sm">
                  <div className="relative mb-3 flex items-center justify-center px-10">
                    <span className="text-muted-foreground absolute left-0 flex size-9 items-center justify-center rounded-xl">
                      <ChevronLeft className="size-5" />
                    </span>
                    <span className="text-center text-sm font-semibold tracking-tight">
                      {capitalizeFirst(monthLabel)}
                    </span>
                    <span className="text-muted-foreground absolute right-0 flex size-9 items-center justify-center rounded-xl">
                      <ChevronRight className="size-5" />
                    </span>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide">
                    {WEEK_DAY_LETTERS.map((letter, index) => (
                      <div key={index} className="py-2">
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {cells.map((cell, index) => {
                      const selected = cell.inMonth && cell.day === today.day;
                      const hasAppointments =
                        cell.inMonth && cell.weekday >= 1 && cell.weekday <= 5;
                      return (
                        <div key={index} className="flex flex-col items-center py-0.5">
                          <span
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full text-sm leading-none font-semibold",
                              cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                              selected && "bg-primary text-primary-foreground shadow-sm",
                            )}
                          >
                            {cell.day}
                          </span>
                          <span className="mt-0.5 flex h-2 items-center justify-center">
                            <span
                              className={cn(
                                "block size-1.5 rounded-full",
                                hasAppointments ? "bg-primary" : "bg-transparent",
                              )}
                            />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* El día elegido */}
                <div className="grid gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl leading-tight font-bold tracking-tight">
                        {capitalizeFirst(weekday)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm">{dayLong}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <span className="border-border bg-card text-muted-foreground flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm">
                        <span className="font-semibold">0</span>
                        <span className="font-semibold">Canceladas</span>
                      </span>
                      <span className="border-border bg-card text-muted-foreground flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm">
                        <CalendarDays className="text-primary size-4" />
                        <span className="font-semibold">{APPOINTMENTS.length} turnos</span>
                      </span>
                    </div>
                  </div>
                  <ul className="grid gap-3 md:grid-cols-3">
                    {APPOINTMENTS.map((appointment) => (
                      <li key={appointment.time}>
                        <AppointmentCard appointment={appointment} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
