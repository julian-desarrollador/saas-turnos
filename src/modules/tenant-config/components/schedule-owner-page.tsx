import type { Route } from "next";
import Link from "next/link";

import { loadScheduleOwnerPage } from "@/modules/tenant-config";
import { WeeklyScheduleScreen } from "@/modules/tenant-config/components/weekly-schedule-screen";

export async function ScheduleOwnerPage({
  slug,
  kind,
  id,
}: {
  slug: string;
  kind: "branch" | "professional";
  id: string;
}) {
  const page = await loadScheduleOwnerPage(slug, kind, id);
  const listHref = `/${slug}/schedule` as Route;

  if (!page.owner) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Horario</h1>
        <p className="text-muted-foreground text-sm">
          No encontramos esta agenda. Puede que la hayan dado de baja.
        </p>
        <Link
          href={listHref}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Horarios
        </Link>
      </main>
    );
  }

  return (
    <WeeklyScheduleScreen
      slug={slug}
      ownerKind={page.owner.kind}
      ownerId={page.owner.id}
      ownerName={page.owner.displayName}
      slots={page.slots}
      canWrite={page.canWrite}
    />
  );
}
