import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveTenantContext } from "@/server/auth";

export default async function DashboardPage({ params }: PageProps<"/[slug]/dashboard">) {
  const { slug } = await params;
  const ctx = await resolveTenantContext(slug);
  const greeting = ctx.user.firstName ? `Hola, ${ctx.user.firstName}` : "Hola";

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title={greeting}
        description={`Panel de ${ctx.tenant.name}. La agenda de hoy y los clientes son el trabajo del día.`}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/${slug}/agenda` as Route} className="block">
          <Card className="hover:bg-muted/50 min-h-24 transition-colors">
            <CardHeader>
              <CardTitle>Agenda de hoy</CardTitle>
              <CardDescription>Ver huecos y turnos del día.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href={`/${slug}/clients` as Route} className="block">
          <Card className="hover:bg-muted/50 min-h-24 transition-colors">
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Buscar fichas por nombre o teléfono.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
