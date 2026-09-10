import type { Route } from "next";
import Link from "next/link";

import { loadServicePage } from "@/modules/tenant-config";
import { ServiceEditScreen } from "@/modules/tenant-config/components/service-edit-screen";

export default async function ServiceDetailPage({
  params,
}: PageProps<"/[slug]/services/[serviceId]">) {
  const { slug, serviceId } = await params;
  const page = await loadServicePage(slug, serviceId);

  if (!page.service || !page.canWrite) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Servicio</h1>
        <p className="text-muted-foreground text-sm">
          {page.service
            ? "Tu rol no permite cambiar el catálogo. Pedile a un administrador que lo haga."
            : "No encontramos este servicio."}
        </p>
        <Link
          href={`/${slug}/services` as Route}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Servicios
        </Link>
      </main>
    );
  }

  return <ServiceEditScreen slug={slug} service={page.service} />;
}
