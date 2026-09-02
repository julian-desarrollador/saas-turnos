import { loadClientsPage } from "@/modules/clients";
import { ClientsHomeClient } from "@/modules/clients/components/clients-home-client";

export default async function ClientsPage({ params, searchParams }: PageProps<"/[slug]/clients">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadClientsPage(slug, query);

  return (
    <ClientsHomeClient
      slug={page.slug}
      tenantName={page.tenantName}
      initialQuery={page.query}
      initialClients={page.clients}
      initialHasMore={page.hasMore}
      initialListLimit={page.listLimit}
      initialError={page.error}
    />
  );
}
