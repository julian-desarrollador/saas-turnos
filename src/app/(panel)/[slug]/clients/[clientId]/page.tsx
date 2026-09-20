import type { Route } from "next";
import { notFound } from "next/navigation";

import { loadClientFichaPage } from "@/modules/clients";
import { ClientsError } from "@/modules/clients/application/errors";
import { ClientFichaClient } from "@/modules/clients/components/client-ficha-client";
import { ClientFichaFeedbackToast } from "@/modules/clients/components/client-ficha-feedback-toast";
import {
  clientFichaBackAriaLabel,
  clientFichaBackHref,
  clientFichaToastMessage,
} from "@/modules/clients/components/client-ficha-view";

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

export default async function ClientFichaPage({
  params,
  searchParams,
}: PageProps<"/[slug]/clients/[clientId]">) {
  const { slug, clientId } = await params;
  const query = await searchParams;
  const from = readQueryValue(query.from);
  const date = readQueryValue(query.date);
  const toastMessage = clientFichaToastMessage(readQueryValue(query.saved));

  let page: Awaited<ReturnType<typeof loadClientFichaPage>>;
  try {
    page = await loadClientFichaPage(slug, clientId);
  } catch (error) {
    if (error instanceof ClientsError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <ClientFichaFeedbackToast message={toastMessage} />
      <ClientFichaClient
        slug={slug}
        from={from}
        date={date}
        backHref={clientFichaBackHref(slug, from, date) as Route}
        backAriaLabel={clientFichaBackAriaLabel(from, date)}
        client={page.client}
        appointments={page.appointments}
        hasMoreAppointments={page.hasMoreAppointments}
        appointmentLimit={page.appointmentLimit}
        canWrite={page.canWrite}
      />
    </>
  );
}
