import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadReschedulePage } from "@/modules/booking";
import { BookingError } from "@/modules/booking/application/errors";
import { RescheduleConfirmForm } from "@/modules/booking/components/reschedule-confirm-form";
import { RescheduleFilters } from "@/modules/booking/components/reschedule-filters";

function rescheduleHref(
  slug: string,
  appointmentId: string,
  query: { date: string; professional: string; time?: string },
): Route {
  const params = new URLSearchParams();
  params.set("date", query.date);
  params.set("professional", query.professional);
  if (query.time) {
    params.set("time", query.time);
  }
  return `/${slug}/agenda/${appointmentId}/reprogramar?${params.toString()}` as Route;
}

function agendaBackHref(slug: string, date: string): Route {
  const params = new URLSearchParams();
  params.set("date", date);
  return `/${slug}/agenda?${params.toString()}` as Route;
}

function clientLabel(appointment: {
  clientFirstName: string | null;
  clientLastName: string | null;
  clientPhone: string;
}): string {
  const name = [appointment.clientFirstName, appointment.clientLastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  if (name && appointment.clientPhone) {
    return `${name} · ${appointment.clientPhone}`;
  }
  return name || appointment.clientPhone || "Cliente";
}

export default async function ReschedulePage({
  params,
  searchParams,
}: PageProps<"/[slug]/agenda/[appointmentId]/reprogramar">) {
  const { slug, appointmentId } = await params;
  const query = await searchParams;

  let page: Awaited<ReturnType<typeof loadReschedulePage>>;
  try {
    page = await loadReschedulePage(slug, appointmentId, query);
  } catch (error) {
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const professionalName =
    page.professionals.find((item) => item.id === page.professionalId)?.displayName ?? "";
  const timeIsOffered = page.selectedTime !== "" && page.slots.includes(page.selectedTime);
  const backHref = agendaBackHref(slug, page.appointment.localDate);

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Cambiar horario"
        description={`Reprogramá el turno de ${page.tenantName}. El servicio y el cliente no cambian.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Turno actual</CardTitle>
          <CardDescription>
            {page.appointment.serviceName} con {page.appointment.professionalName}. Esto no cambia
            hasta que confirmes un hueco nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <p className="font-mono">
            {page.appointment.localDate} {page.appointment.localTime}–{page.appointment.endTime}
          </p>
          <p>{clientLabel(page.appointment)}</p>
        </CardContent>
      </Card>

      {!page.appointment.movable ? (
        <p className="text-destructive text-sm">Ese turno no se puede reprogramar.</p>
      ) : page.professionals.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ningún profesional activo ofrece este servicio.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo horario</CardTitle>
            <CardDescription>
              Elegí día y profesional. Los huecos usan el servicio de este turno y no cuentan el
              cupo que se está moviendo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RescheduleFilters
              key={`${page.date}-${page.professionalId}`}
              slug={slug}
              appointmentId={appointmentId}
              date={page.date}
              professionalId={page.professionalId}
              professionals={page.professionals}
              slots={page.slots}
              selectedTime={page.selectedTime}
              error={page.error}
            />
            {page.selectedTime && !timeIsOffered && !page.error ? (
              <p className="text-destructive text-sm">
                Ese horario ya no está disponible. Elegí otro.
              </p>
            ) : null}
            {timeIsOffered && page.canWrite ? (
              <div className="grid gap-2">
                <RescheduleConfirmForm
                  key={`${page.date}-${page.professionalId}-${page.selectedTime}`}
                  slug={slug}
                  appointmentId={appointmentId}
                  date={page.date}
                  professionalId={page.professionalId}
                  time={page.selectedTime}
                  professionalName={professionalName}
                  serviceName={page.appointment.serviceName}
                />
                <Link
                  href={rescheduleHref(slug, appointmentId, {
                    date: page.date,
                    professional: page.professionalId,
                  })}
                  className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                >
                  Elegir otro horario
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
      >
        Volver a Agenda
      </Link>
    </main>
  );
}
