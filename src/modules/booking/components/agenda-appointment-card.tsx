import { CalendarClock, Check, FileText, Sparkles, User } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { MonthAppointment } from "@/modules/booking/application/use-cases/list-month-agenda";
import { AgendaCancelForm } from "@/modules/booking/components/agenda-cancel-form";
import { AgendaCompleteForm } from "@/modules/booking/components/agenda-complete-form";
import { AgendaNoShowForm } from "@/modules/booking/components/agenda-no-show-form";
import type { DeferredAgendaKind } from "@/modules/booking/components/use-deferred-agenda-status";
import { isOpenAppointment } from "@/modules/booking/domain/appointment-lifecycle";
import { isCancelledOrNoShow } from "@/modules/booking/domain/month-grid";
import { formatDurationLabel } from "@/modules/booking/domain/time";
import { whatsAppChatUrl } from "@/modules/clients/domain/phone";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function clientName(appointment: MonthAppointment): string {
  const name = [appointment.clientFirstName, appointment.clientLastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || "Cliente";
}

function statusChip(status: string): {
  label: string;
  className: string;
  showCheck: boolean;
} {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Atendido",
        className: "bg-muted text-foreground",
        showCheck: true,
      };
    case "CANCELLED":
      return {
        label: "Cancelado",
        className: "bg-muted text-muted-foreground",
        showCheck: false,
      };
    case "NO_SHOW":
      return {
        label: "Ausente",
        className: "bg-muted text-muted-foreground",
        showCheck: false,
      };
    case "IN_PROGRESS":
      return {
        label: "En curso",
        className: "bg-muted text-foreground",
        showCheck: false,
      };
    default:
      return {
        label: "Confirmada",
        className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
        showCheck: true,
      };
  }
}

function WhatsAppLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-[#128C7E] underline-offset-2 hover:underline"
    >
      <WhatsAppIcon className="size-4 shrink-0" />
      <span className="truncate">WhatsApp</span>
    </a>
  );
}

export function AgendaAppointmentCard({
  slug,
  date,
  appointment,
  canWrite,
  onDeferStatus,
}: {
  slug: string;
  date: string;
  appointment: MonthAppointment;
  canWrite: boolean;
  onDeferStatus?: (kind: DeferredAgendaKind) => void;
}) {
  const open = isOpenAppointment(appointment.status);
  const muted = isCancelledOrNoShow(appointment.status);
  const chip = statusChip(appointment.status);
  const name = clientName(appointment);
  const duration = formatDurationLabel(appointment.durationMinutes);
  const whatsAppUrl = appointment.clientPhone ? whatsAppChatUrl(appointment.clientPhone) : null;

  return (
    <article
      className={cn(
        "bg-card overflow-hidden rounded-[22px] border shadow-[0_6px_24px_rgba(0,0,0,0.06)]",
        muted && "opacity-75",
      )}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="bg-muted text-foreground rounded-full px-3.5 py-1.5 text-base leading-none font-semibold tracking-tight tabular-nums">
            {appointment.localTime}
          </span>
          <span className="text-muted-foreground shrink-0 text-[15px] font-semibold tracking-tight tabular-nums">
            {duration}
          </span>
        </div>

        <h3 className="mt-3 text-[22px] leading-tight font-bold break-words">{name}</h3>

        <p className="text-muted-foreground mt-2 flex items-start gap-2 text-sm leading-snug">
          <Sparkles className="text-primary mt-0.5 size-4 shrink-0" strokeWidth={1.85} />
          <span className="min-w-0">{appointment.serviceName}</span>
        </p>

        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
          <User className="size-3.5 shrink-0" strokeWidth={1.75} />
          {appointment.professionalName}
        </p>

        {appointment.clientId ? (
          <Link
            href={`/${slug}/clients/${appointment.clientId}` as Route}
            className="text-primary mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium underline-offset-2 hover:underline"
          >
            <FileText className="size-3.5 shrink-0" strokeWidth={2} />
            Ver ficha
          </Link>
        ) : null}

        <div className="mt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
              chip.className,
            )}
          >
            {chip.showCheck ? <Check className="size-3.5 shrink-0" strokeWidth={2.5} /> : null}
            {chip.label}
          </span>
        </div>
      </div>

      {canWrite && open ? (
        <div className="border-border border-t px-4 pt-3 pb-3.5">
          <Link
            href={`/${slug}/agenda/${appointment.id}/reprogramar` as Route}
            className="border-border bg-background hover:bg-muted flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 text-[15px] font-semibold transition active:scale-[0.99]"
          >
            <CalendarClock className="size-5 shrink-0" strokeWidth={2} />
            Reprogramar
          </Link>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <AgendaCompleteForm
              slug={slug}
              date={date}
              professionalId={appointment.professionalId}
              serviceId=""
              appointmentId={appointment.id}
              appearance="card"
              onRequest={
                onDeferStatus
                  ? () => {
                      onDeferStatus("completed");
                    }
                  : undefined
              }
            />
            <AgendaNoShowForm
              slug={slug}
              date={date}
              professionalId={appointment.professionalId}
              serviceId=""
              appointmentId={appointment.id}
              appearance="card"
              onRequest={
                onDeferStatus
                  ? () => {
                      onDeferStatus("noShow");
                    }
                  : undefined
              }
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            {whatsAppUrl ? <WhatsAppLink href={whatsAppUrl} /> : <span />}
            <AgendaCancelForm
              slug={slug}
              date={date}
              professionalId={appointment.professionalId}
              serviceId=""
              appointmentId={appointment.id}
              appearance="link"
            />
          </div>
        </div>
      ) : whatsAppUrl ? (
        <div className="border-border border-t px-4 py-3">
          <WhatsAppLink href={whatsAppUrl} />
        </div>
      ) : null}
    </article>
  );
}
