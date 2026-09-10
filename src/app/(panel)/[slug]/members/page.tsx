import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadMembersPage } from "@/core/membership";
import {
  memberDisplayName,
  membershipRoleLabel,
} from "@/core/membership/adapters/inbound/messages";
import { InviteMemberForm } from "@/core/membership/components/invite-member-form";

export default async function MembersPage({ params }: PageProps<"/[slug]/members">) {
  const { slug } = await params;
  const page = await loadMembersPage(slug);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <PageHeader
        title="Accesos"
        description={`Quién puede entrar al panel de ${page.tenantName}. Invitar no agrega a la persona en la agenda: eso se hace en Equipo.`}
      />

      {page.canInvite ? (
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Invitar</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteMemberForm slug={slug} />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Miembros</h2>
        {page.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay miembros activos.</p>
        ) : (
          <ul className="divide-border max-w-2xl divide-y rounded-xl border">
            {page.members.map((member) => (
              <li key={member.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium">{memberDisplayName(member)}</p>
                  <p className="text-muted-foreground text-sm">{member.email}</p>
                </div>
                <p className="text-sm">{membershipRoleLabel(member.role)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invitaciones pendientes</h2>
        {page.invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay invitaciones pendientes.</p>
        ) : (
          <ul className="divide-border max-w-2xl divide-y rounded-xl border">
            {page.invites.map((invite) => (
              <li key={invite.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <p className="font-medium">{invite.email}</p>
                <p className="text-sm">{membershipRoleLabel(invite.role)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
