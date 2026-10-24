import type { Route } from "next";
import Link from "next/link";
import { panelPath } from "@/core/panel-routes";

import { loadProfessionalCreatePage } from "@/modules/tenant-config";
import { ProfessionalCreateScreen } from "@/modules/tenant-config/components/professional-create-screen";

export default async function NewProfessionalPage({
  params,
}: PageProps<"/[slug]/panel/professionals/nuevo">) {
  const { slug } = await params;
  const page = await loadProfessionalCreatePage(slug);

  if (!page.canWrite) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Agregar profesional</h1>
        <p className="text-muted-foreground text-sm">
          Tu rol no permite cambiar el equipo. Pedile a un administrador que lo haga.
        </p>
        <Link
          href={`${panelPath(slug, "professionals")}` as Route}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Equipo
        </Link>
      </main>
    );
  }

  return <ProfessionalCreateScreen slug={slug} services={page.services} branches={page.branches} />;
}
