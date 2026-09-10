import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadSchedulePage, type WeeklySlotRecord } from "@/modules/tenant-config";
import { CalendarBlockForm } from "@/modules/tenant-config/components/calendar-block-form";
import { CalendarBlockList } from "@/modules/tenant-config/components/calendar-block-list";
import { WeeklyScheduleForm } from "@/modules/tenant-config/components/weekly-schedule-form";

function slotsForOwner(
  slots: WeeklySlotRecord[],
  kind: "branch" | "professional",
  id: string,
): WeeklySlotRecord[] {
  if (kind === "branch") {
    return slots.filter((slot) => slot.branchId === id && slot.professionalId === null);
  }
  return slots.filter((slot) => slot.professionalId === id && slot.branchId === null);
}

export default async function SchedulePage({ params }: PageProps<"/[slug]/schedule">) {
  const { slug } = await params;
  const page = await loadSchedulePage(slug);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <PageHeader
        title="Horarios"
        description={`Semana laboral de ${page.tenantName}. Los turnos ya reservados no se modifican al cambiar este horario.`}
      />

      {page.branches.map((branch) => {
        const slots = slotsForOwner(page.slots, "branch", branch.id);
        return (
          <Card key={branch.id}>
            <CardHeader>
              <CardTitle>{branch.name}</CardTitle>
              <CardDescription>
                Sucursal. La capacidad es el techo del local en esa franja: cuántos turnos caben a
                la vez, en todo el equipo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyScheduleForm
                key={slots.map((slot) => slot.id).join("-") || branch.id}
                slug={slug}
                ownerKind="branch"
                ownerId={branch.id}
                slots={slots}
                canWrite={page.canWriteSchedule}
              />
            </CardContent>
          </Card>
        );
      })}

      {page.professionals.map((professional) => {
        const slots = slotsForOwner(page.slots, "professional", professional.id);
        return (
          <Card key={professional.id}>
            <CardHeader>
              <CardTitle>{professional.displayName}</CardTitle>
              <CardDescription>
                Profesional. La capacidad es cuántos turnos atiende a la vez en esa franja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyScheduleForm
                key={slots.map((slot) => slot.id).join("-") || professional.id}
                slug={slug}
                ownerKind="professional"
                ownerId={professional.id}
                slots={slots}
                canWrite={page.canWriteSchedule}
              />
            </CardContent>
          </Card>
        );
      })}

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Bloqueos</CardTitle>
          <CardDescription>Vacaciones, feriados o un rato tapado en la agenda.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {page.canWriteBlocks ? (
            <CalendarBlockForm
              slug={slug}
              branches={page.branches}
              professionals={page.professionals}
            />
          ) : null}
          <CalendarBlockList
            slug={slug}
            blocks={page.blocks}
            branches={page.branches}
            professionals={page.professionals}
            canWrite={page.canWriteBlocks}
          />
        </CardContent>
      </Card>
    </main>
  );
}
