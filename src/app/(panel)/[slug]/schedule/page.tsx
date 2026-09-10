import { ChevronRight, TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { loadSchedulePage } from "@/modules/tenant-config";
import { ScheduleFeedbackToast } from "@/modules/tenant-config/components/schedule-feedback-toast";
import {
  branchScheduleCards,
  professionalScheduleCards,
  scheduleOwnerHref,
  scheduleToastMessage,
  type ScheduleOwnerSummary,
} from "@/modules/tenant-config/components/schedule-view";

type QueryValue = string | string[] | undefined;

function readQueryValue(value: QueryValue): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

function OwnerCard({
  slug,
  owner,
  warnIfEmpty,
}: {
  slug: string;
  owner: ScheduleOwnerSummary;
  warnIfEmpty: boolean;
}) {
  const href = scheduleOwnerHref(slug, owner.kind, owner.id) as Route;
  const showWarning = warnIfEmpty && owner.isActive && !owner.hasSchedule;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition",
          !owner.isActive && "opacity-70",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="min-w-0 truncate text-xl font-bold tracking-tight">{owner.displayName}</p>
          {owner.hasSchedule ? (
            <p className="text-muted-foreground mt-1 text-sm">{owner.weekLabel}</p>
          ) : showWarning ? (
            <p className="text-destructive mt-1.5 flex items-start gap-1.5 text-sm font-medium">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
              <span>Sin horario cargado: no aparecen turnos disponibles.</span>
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">Sin horario cargado</p>
          )}
        </div>
        <ChevronRight className="text-muted-foreground size-5 shrink-0" strokeWidth={2.2} />
      </Link>
    </li>
  );
}

export default async function SchedulePage({
  params,
  searchParams,
}: PageProps<"/[slug]/schedule">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadSchedulePage(slug);
  const branches = branchScheduleCards(page.branches, page.slots);
  const professionals = professionalScheduleCards(page.professionals, page.slots);
  const toastMessage =
    readQueryValue(query.saved) === "1" ? scheduleToastMessage(readQueryValue(query.who)) : null;

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-2xl leading-tight font-bold">Horarios</h1>
        <p className="text-muted-foreground text-sm">
          Cuándo atiende el local y cada persona de {page.tenantName}. Tocá para ver o cambiar la
          semana. Los turnos ya reservados no se mueven.
        </p>
      </header>

      <ScheduleFeedbackToast message={toastMessage} />

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">El local</h2>
        {branches.length === 0 ? (
          <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
            Todavía no hay una sucursal cargada.
          </p>
        ) : (
          <ul className="grid gap-3">
            {branches.map((branch) => (
              <OwnerCard key={branch.id} slug={slug} owner={branch} warnIfEmpty />
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">El equipo</h2>
        {professionals.length === 0 ? (
          <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
            Todavía no hay nadie en el equipo.
          </p>
        ) : (
          <ul className="grid gap-3">
            {professionals.map((professional) => (
              <OwnerCard
                key={professional.id}
                slug={slug}
                owner={professional}
                warnIfEmpty={professional.isActive}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground text-sm">
        Para tapar un día o un rato, usá{" "}
        <Link
          href={`/${slug}/agenda/bloquear` as Route}
          className="text-foreground font-semibold underline-offset-4 hover:underline"
        >
          Bloquear horario
        </Link>{" "}
        en Agenda.
      </p>
    </main>
  );
}
