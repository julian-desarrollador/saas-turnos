import { notFound } from "next/navigation";

import { loadClientFichaPage } from "@/modules/clients";
import { ClientsError } from "@/modules/clients/application/errors";
import { ClientFichaClient } from "@/modules/clients/components/client-ficha-client";

export default async function ClientFichaPage({ params }: PageProps<"/[slug]/clients/[clientId]">) {
  const { slug, clientId } = await params;

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
    <ClientFichaClient
      slug={page.slug}
      client={page.client}
      appointments={page.appointments}
      hasMoreAppointments={page.hasMoreAppointments}
      appointmentLimit={page.appointmentLimit}
      canWrite={page.canWrite}
    />
  );
}
