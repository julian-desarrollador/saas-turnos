import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { loadMembersPage, memberDisplayName, membershipRoleLabel } from "@/core/membership";
import { MembersFeedbackToast } from "@/core/membership/components/members-feedback-toast";
import { inviteToastMessage, membershipRoleBlurb } from "@/core/membership/components/member-view";
import { cn } from "@/lib/utils";

type QueryValue = string | string[] | undefined;

function readQueryValue(value: QueryValue): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

export default async function MembersPage({ params, searchParams }: PageProps<"/[slug]/members">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadMembersPage(slug);
  const toastMessage =
    readQueryValue(query.invited) === "1" ? inviteToastMessage(readQueryValue(query.who)) : null;

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-2xl leading-tight font-bold">Accesos</h1>
        <p className="text-muted-foreground text-sm">
          Quién puede entrar al panel de {page.tenantName}. Invitar da acceso al panel. Aparecer en
          la agenda se hace en Equipo.
        </p>
      </header>

      {page.canInvite ? (
        <Link
          href={`/${slug}/members/invitar` as Route}
          className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-sm"
        >
          <Plus className="size-5" strokeWidth={2.2} />
          Invitar
        </Link>
      ) : null}

      <MembersFeedbackToast message={toastMessage} />

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Quién entra</h2>
        {page.members.length === 0 ? (
          <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
            Todavía no hay nadie con acceso.
          </p>
        ) : (
          <ul className="grid gap-3">
            {page.members.map((member) => (
              <li
                key={member.id}
                className="border-border bg-card rounded-2xl border px-4 py-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-xl font-bold tracking-tight">
                    {memberDisplayName(member)}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      member.role === "OWNER" || member.role === "ADMIN"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {membershipRoleLabel(member.role)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-sm">{member.email}</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {membershipRoleBlurb(member.role)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {page.invites.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Invitaciones pendientes</h2>
          <ul className="grid gap-3">
            {page.invites.map((invite) => (
              <li
                key={invite.id}
                className="border-border bg-card rounded-2xl border px-4 py-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-lg font-bold tracking-tight">
                    {invite.email}
                  </p>
                  <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                    {membershipRoleLabel(invite.role)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Esperando que acepte el correo.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
