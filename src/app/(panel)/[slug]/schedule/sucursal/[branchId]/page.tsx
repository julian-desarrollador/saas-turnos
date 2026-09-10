import { ScheduleOwnerPage } from "@/modules/tenant-config/components/schedule-owner-page";

export default async function BranchSchedulePage({
  params,
}: PageProps<"/[slug]/schedule/sucursal/[branchId]">) {
  const { slug, branchId } = await params;
  return <ScheduleOwnerPage slug={slug} kind="branch" id={branchId} />;
}
