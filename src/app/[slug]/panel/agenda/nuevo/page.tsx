import { loadAgendaNuevoPage } from "@/modules/booking";
import { AgendaNuevoWizard } from "@/modules/booking/components/agenda-nuevo-wizard";

export default async function AgendaNuevoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    date?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadAgendaNuevoPage(slug, query);

  if (page.catalogEmptyReason) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Nuevo turno</h1>
        <p className="text-muted-foreground text-sm">{page.catalogEmptyReason}</p>
      </main>
    );
  }

  return (
    <AgendaNuevoWizard
      slug={page.slug}
      tenantName={page.tenantName}
      today={page.today}
      initialDate={page.initialDate}
      canWrite={page.canWrite}
      professionals={page.professionals}
      services={page.services}
    />
  );
}
