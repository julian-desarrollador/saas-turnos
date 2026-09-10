import { ScheduleOwnerPage } from "@/modules/tenant-config/components/schedule-owner-page";

export default async function ProfessionalSchedulePage({
  params,
}: PageProps<"/[slug]/schedule/profesional/[professionalId]">) {
  const { slug, professionalId } = await params;
  return <ScheduleOwnerPage slug={slug} kind="professional" id={professionalId} />;
}
