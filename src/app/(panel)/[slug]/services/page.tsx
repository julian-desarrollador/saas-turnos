import { ChevronRight, Plus, TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { loadServicesPage } from "@/modules/tenant-config";
import { ServiceFeedbackToast } from "@/modules/tenant-config/components/service-feedback-toast";
import {
  serviceMetaLabel,
  serviceSummaries,
  serviceToastMessage,
  type ServiceToastKind,
} from "@/modules/tenant-config/components/service-view";

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
}): ServiceToastKind | null {
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

export default async function ServicesPage({
  params,
  searchParams,
}: PageProps<"/[slug]/services">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadServicesPage(slug);
  const summaries = serviceSummaries(page.services, page.professionals);
  const toastMessage = serviceToastMessage(readToastKind(query), readQueryValue(query.who));

  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-2xl leading-tight font-bold">Servicios</h1>
        <p className="text-muted-foreground text-sm">
          Qué se ofrece en {page.tenantName}. Tocá un servicio para ver o cambiarlo.
        </p>
      </header>

      {page.canWrite ? (
        <Link
          href={`/${slug}/services/nuevo` as Route}
          className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-sm"
        >
          <Plus className="size-5" strokeWidth={2.2} />
          Agregar servicio
        </Link>
      ) : null}

      <ServiceFeedbackToast message={toastMessage} />

      {summaries.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
          Todavía no hay servicios. Agregá el primero para poder dar turnos.
        </p>
      ) : (
        <ul className="grid gap-3">
          {summaries.map((service) => {
            const content = (
              <>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xl font-bold tracking-tight">
                    {service.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      service.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {service.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {serviceMetaLabel(service.durationMinutes, service.priceAmount)}
                </p>
                {service.isActive && service.offeredByCount === 0 ? (
                  <p className="text-destructive mt-1.5 flex items-start gap-1.5 text-sm font-medium">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
                    <span>Nadie del equipo lo ofrece.</span>
                  </p>
                ) : null}
              </>
            );

            return (
              <li key={service.id}>
                {page.canWrite ? (
                  <Link
                    href={`/${slug}/services/${service.id}` as Route}
                    className={cn(
                      "border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition",
                      !service.isActive && "opacity-70",
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
                      !service.isActive && "opacity-70",
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
