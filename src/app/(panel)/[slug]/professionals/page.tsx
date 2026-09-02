import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfessionalCard } from "@/modules/tenant-config/components/professional-card";
import { ProfessionalCreateForm } from "@/modules/tenant-config/components/professional-create-form";
import { loadProfessionalsPage } from "@/modules/tenant-config";

export default async function ProfessionalsPage({ params }: PageProps<"/[slug]/professionals">) {
  const { slug } = await params;
  const page = await loadProfessionalsPage(slug);

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Equipo"
        description={`Profesionales que aparecen en la agenda de ${page.tenantName}.`}
      />

      {page.canWrite ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Nuevo profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfessionalCreateForm slug={slug} branches={page.branches} />
          </CardContent>
        </Card>
      ) : null}

      {page.professionals.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todavía no hay profesionales.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {page.professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              slug={slug}
              professional={professional}
              services={page.services}
              canWrite={page.canWrite}
            />
          ))}
        </div>
      )}
    </main>
  );
}
