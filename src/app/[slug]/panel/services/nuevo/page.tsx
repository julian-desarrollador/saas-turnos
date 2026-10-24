import type { Route } from "next";
import Link from "next/link";
import { panelPath } from "@/core/panel-routes";

import { loadServiceCreatePage } from "@/modules/tenant-config";
import { ServiceCreateScreen } from "@/modules/tenant-config/components/service-create-screen";

export default async function NewServicePage({
  params,
}: PageProps<"/[slug]/panel/services/nuevo">) {
  const { slug } = await params;
  const page = await loadServiceCreatePage(slug);

  if (!page.canWrite) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Agregar servicio</h1>
        <p className="text-muted-foreground text-sm">
          Tu rol no permite cambiar el catálogo. Pedile a un administrador que lo haga.
        </p>
        <Link
          href={`${panelPath(slug, "services")}` as Route}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Servicios
        </Link>
      </main>
    );
  }

  return <ServiceCreateScreen slug={slug} />;
}
