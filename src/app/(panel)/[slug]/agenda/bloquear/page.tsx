import { AgendaBloquearWizard } from "@/modules/booking/components/agenda-bloquear-wizard";
import { loadCalendarBlocksPage } from "@/modules/tenant-config";

export default async function AgendaBloquearPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadCalendarBlocksPage(slug);

  return (
    <AgendaBloquearWizard
      slug={page.slug}
      tenantName={page.tenantName}
      canWrite={page.canWriteBlocks}
      branches={page.branches}
      professionals={page.professionals}
      blocks={page.blocks}
    />
  );
}
