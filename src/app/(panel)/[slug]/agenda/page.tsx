import { loadAgendaHomePage } from "@/modules/booking";
import { AgendaHomeClient } from "@/modules/booking/components/agenda-home-client";

export default async function AgendaPage({ params, searchParams }: PageProps<"/[slug]/agenda">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadAgendaHomePage(slug, query);

  return (
    <AgendaHomeClient
      slug={page.slug}
      tenantName={page.tenantName}
      today={page.today}
      initialDate={page.initialDate}
      initialMonth={page.initialMonth}
      initialShowCancelled={page.initialShowCancelled}
      canWrite={page.canWrite}
      appointments={page.appointments}
      blocks={page.blocks}
      booked={page.booked}
      cancelled={page.cancelled}
      rescheduled={page.rescheduled}
      noShow={page.noShow}
      completed={page.completed}
      blocked={page.blocked}
      blockWho={page.blockWho}
      blockFrom={page.blockFrom}
      blockTo={page.blockTo}
      blockStart={page.blockStart}
      blockEnd={page.blockEnd}
    />
  );
}
