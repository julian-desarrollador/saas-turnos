import { ChevronRight, Plus, TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { loadProfessionalsPage } from "@/modules/tenant-config";
import {
  professionalSummaries,
  scheduledProfessionalIds,
  serviceCountLabel,
  teamToastMessage,
  type TeamToastKind,
} from "@/modules/tenant-config/components/professional-view";
import { TeamFeedbackToast } from "@/modules/tenant-config/components/team-feedback-toast";

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

function readToastKind(query: {
  created?: QueryValue;
  saved?: QueryValue;
  activated?: QueryValue;
  deactivated?: QueryValue;
}): TeamToastKind | null {
  if (readQueryValue(query.created) === "1") {
    return "created";
  }
  if (readQueryValue(query.saved) === "1") {
    return "saved";
  }
  if (readQueryValue(query.activated) === "1") {
    return "activated";
  }
  if (readQueryValue(query.deactivated) === "1") {
    return "deactivated";
  }
  return null;
}

export default async function ProfessionalsPage({
  params,
  searchParams,
}: PageProps<"/[slug]/professionals">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadProfessionalsPage(slug);
  const summaries = professionalSummaries(page.professionals, scheduledProfessionalIds(page.slots));
  const toastMessage = teamToastMessage(readToastKind(query), readQueryValue(query.who));

  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-2xl leading-tight font-bold">Equipo</h1>
        <p className="text-muted-foreground text-sm">
          Quiénes atienden en {page.tenantName}. Tocá a una persona para ver o cambiar sus datos.
        </p>
      </header>

      {page.canWrite ? (
        <Link
          href={`/${slug}/professionals/nuevo` as Route}
          className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-sm"
        >
          <Plus className="size-5" strokeWidth={2.2} />
          Agregar profesional
        </Link>
      ) : null}

      <TeamFeedbackToast message={toastMessage} />

      {summaries.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
          Todavía no hay nadie en el equipo. Agregá a la primera persona para poder dar turnos.
        </p>
      ) : (
        <ul className="grid gap-3">
          {summaries.map((professional) => {
            const content = (
              <>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xl font-bold tracking-tight">
                    {professional.displayName}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      professional.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {professional.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-1 text-sm",
                    professional.serviceCount === 0
                      ? "text-destructive font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {serviceCountLabel(professional.serviceCount)}
                </p>

                {professional.isActive && !professional.hasSchedule ? (
                  <p className="text-destructive mt-1.5 flex items-start gap-1.5 text-sm font-medium">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
                    <span>Sin horario cargado: no aparecen turnos disponibles.</span>
                  </p>
                ) : null}
              </>
            );

            return (
              <li key={professional.id}>
                {page.canWrite ? (
                  <Link
                    href={`/${slug}/professionals/${professional.id}` as Route}
                    className={cn(
                      "border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition",
                      !professional.isActive && "opacity-70",
                    )}
                  >
                    <div className="min-w-0 flex-1">{content}</div>
                    <ChevronRight
                      className="text-muted-foreground size-5 shrink-0"
                      strokeWidth={2.2}
                    />
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "border-border bg-card rounded-2xl border px-4 py-4 shadow-sm",
                      !professional.isActive && "opacity-70",
                    )}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
