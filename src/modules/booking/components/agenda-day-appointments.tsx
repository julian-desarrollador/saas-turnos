import type { Route } from "next";
import Link from "next/link";

import type { DayAppointment } from "@/modules/booking/application/use-cases/list-day-appointments";
import { AgendaCancelForm } from "@/modules/booking/components/agenda-cancel-form";
import { AgendaCompleteForm } from "@/modules/booking/components/agenda-complete-form";
import { AgendaNoShowForm } from "@/modules/booking/components/agenda-no-show-form";
import { isOpenAppointment } from "@/modules/booking/domain/appointment-lifecycle";

function clientLabel(appointment: DayAppointment): string {
  const name = [appointment.clientFirstName, appointment.clientLastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  if (name && appointment.clientPhone) {
    return `${name} · ${appointment.clientPhone}`;
  }
  return name || appointment.clientPhone || "Cliente";
}

export function AgendaDayAppointments({
  slug,
  date,
  professionalId,
  serviceId,
  appointments,
  canWrite,
}: {
  slug: string;
  date: string;
  professionalId: string;
  serviceId: string;
  appointments: DayAppointment[];
  canWrite: boolean;
}) {
  if (appointments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay turnos cargados para este profesional en este día.
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y rounded-lg border">
      {appointments.map((appointment) => {
        const open = isOpenAppointment(appointment.status);
        return (
          <li key={appointment.id} className="grid gap-3 px-3 py-3">
            <div className="grid gap-0.5">
              <p className="font-mono text-sm">
                {appointment.localTime}–{appointment.endTime}
                {appointment.status === "COMPLETED" ? (
                  <span className="text-muted-foreground ml-2 font-sans text-sm">Atendido</span>
                ) : null}
              </p>
              <p className="text-sm">{appointment.serviceName}</p>
              {appointment.clientId ? (
                <Link
                  href={`/${slug}/clients/${appointment.clientId}` as Route}
                  className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                >
                  {clientLabel(appointment)}
                </Link>
              ) : (
                <p className="text-muted-foreground text-sm">{clientLabel(appointment)}</p>
              )}
            </div>
            {canWrite && open ? (
              <div className="flex flex-wrap items-start gap-2">
                <AgendaCompleteForm
                  slug={slug}
                  date={date}
                  professionalId={professionalId}
                  serviceId={serviceId}
                  appointmentId={appointment.id}
                />
                <AgendaNoShowForm
                  slug={slug}
                  date={date}
                  professionalId={professionalId}
                  serviceId={serviceId}
                  appointmentId={appointment.id}
                />
                <Link
                  href={`/${slug}/agenda/${appointment.id}/reprogramar` as Route}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-10 min-h-10 items-center rounded-lg px-2.5 text-sm font-medium"
                >
                  Reprogramar
                </Link>
                <AgendaCancelForm
                  slug={slug}
                  date={date}
                  professionalId={professionalId}
                  serviceId={serviceId}
                  appointmentId={appointment.id}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
