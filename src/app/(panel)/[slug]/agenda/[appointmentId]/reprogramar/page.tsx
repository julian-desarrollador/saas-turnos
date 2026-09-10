import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { loadReschedulePage } from "@/modules/booking";
import { BookingError } from "@/modules/booking/application/errors";
import { AgendaRescheduleWizard } from "@/modules/booking/components/agenda-reschedule-wizard";

function agendaBackHref(slug: string, date: string): Route {
  const params = new URLSearchParams();
  params.set("date", date);
  return `/${slug}/agenda?${params.toString()}` as Route;
}

export default async function ReschedulePage({
  params,
}: PageProps<"/[slug]/agenda/[appointmentId]/reprogramar">) {
  const { slug, appointmentId } = await params;

  let page: Awaited<ReturnType<typeof loadReschedulePage>>;
  try {
    page = await loadReschedulePage(slug, appointmentId);
  } catch (error) {
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const backHref = agendaBackHref(slug, page.appointment.localDate);

  if (!page.appointment.movable || !page.canWrite || page.professionals.length === 0) {
    const message = !page.appointment.movable
      ? "Este turno ya no se puede reprogramar."
      : !page.canWrite
        ? "No tenés permiso para reprogramar turnos."
        : "Ningún profesional activo ofrece este servicio.";

    return (
      <main className="mx-auto grid max-w-md gap-4 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Cambiar turno</h1>
        <p className="text-muted-foreground text-base">{message}</p>
        <Link
          href={backHref}
          className="border-border bg-background hover:bg-muted inline-flex h-12 items-center justify-center rounded-xl border text-base font-semibold"
        >
          Volver a Agenda
        </Link>
      </main>
    );
  }

  return (
    <AgendaRescheduleWizard
      slug={slug}
      today={page.today}
      appointment={page.appointment}
      professionals={page.professionals}
    />
  );
}
