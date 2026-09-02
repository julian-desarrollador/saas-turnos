import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCard } from "@/modules/tenant-config/components/service-card";
import { ServiceCreateForm } from "@/modules/tenant-config/components/service-create-form";
import { loadServicesPage } from "@/modules/tenant-config";

export default async function ServicesPage({ params }: PageProps<"/[slug]/services">) {
  const { slug } = await params;
  const page = await loadServicesPage(slug);

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Servicios"
        description={`Catálogo de prestaciones de ${page.tenantName}.`}
      />

      {page.canWrite ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Nuevo servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceCreateForm slug={slug} />
          </CardContent>
        </Card>
      ) : null}

      {page.services.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todavía no hay servicios.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {page.services.map((service) => (
            <ServiceCard key={service.id} slug={slug} service={service} canWrite={page.canWrite} />
          ))}
        </div>
      )}
    </main>
  );
}
