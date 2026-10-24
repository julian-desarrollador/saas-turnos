import Link from "next/link";
import type { Route } from "next";
import { panelPath } from "@/core/panel-routes";

import { CopyBookingLink } from "@/modules/billing/components/copy-booking-link";
import { clientEnv } from "@/lib/env/client";
import { resolveTenantContext } from "@/server/auth";

export default async function FirstStepsPage({
  params,
}: PageProps<"/[slug]/panel/primeros-pasos">) {
  const { slug } = await params;
  const ctx = await resolveTenantContext(slug);
  const bookingUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/${ctx.tenant.slug}/reservar`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">Primeros pasos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          El negocio nace con un servicio de ejemplo y un horario de lunes a sábado. Cambialos antes
          de compartir el enlace.
        </p>
      </header>
      <ol className="flex flex-col gap-4 text-sm">
        <li>
          <Link
            href={`${panelPath(ctx.tenant.slug, "services")}` as Route}
            className="font-medium underline"
          >
            1. Cambiar el servicio
          </Link>
          <p className="text-muted-foreground">Hoy figura Corte, 45 minutos.</p>
        </li>
        <li>
          <Link
            href={`${panelPath(ctx.tenant.slug, "schedule")}` as Route}
            className="font-medium underline"
          >
            2. Ajustar los horarios
          </Link>
          <p className="text-muted-foreground">La semana de ejemplo es de 9 a 18.</p>
        </li>
        <li>
          <p className="font-medium">3. Compartir la reserva</p>
          <CopyBookingLink href={bookingUrl} />
        </li>
      </ol>
      <Link href={`${panelPath(ctx.tenant.slug, "agenda")}` as Route} className="text-sm underline">
        Ir a la agenda
      </Link>
    </main>
  );
}
