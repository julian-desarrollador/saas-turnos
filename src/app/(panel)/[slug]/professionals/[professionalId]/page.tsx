import type { Route } from "next";
import Link from "next/link";

import { loadProfessionalPage } from "@/modules/tenant-config";
import { ProfessionalEditScreen } from "@/modules/tenant-config/components/professional-edit-screen";

export default async function ProfessionalDetailPage({
  params,
}: PageProps<"/[slug]/professionals/[professionalId]">) {
  const { slug, professionalId } = await params;
  const page = await loadProfessionalPage(slug, professionalId);

  if (!page.professional || !page.canWrite) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Profesional</h1>
        <p className="text-muted-foreground text-sm">
          {page.professional
            ? "Tu rol no permite cambiar el equipo. Pedile a un administrador que lo haga."
            : "No encontramos a esta persona en tu equipo."}
        </p>
        <Link
          href={`/${slug}/professionals` as Route}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Equipo
        </Link>
      </main>
    );
  }

  return (
    <ProfessionalEditScreen
      slug={slug}
      professional={page.professional}
      services={page.services}
      hasSchedule={page.hasSchedule}
    />
  );
}
