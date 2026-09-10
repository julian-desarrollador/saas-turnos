import type { Route } from "next";
import Link from "next/link";

import { loadMembersPage } from "@/core/membership";
import { InviteMemberScreen } from "@/core/membership/components/invite-member-screen";

export default async function InviteMemberPage({ params }: PageProps<"/[slug]/members/invitar">) {
  const { slug } = await params;
  const page = await loadMembersPage(slug);

  if (!page.canInvite) {
    return (
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-8">
        <h1 className="text-2xl font-bold">Invitar</h1>
        <p className="text-muted-foreground text-sm">
          Tu rol no permite invitar. Pedile a un administrador que lo haga.
        </p>
        <Link
          href={`/${slug}/members` as Route}
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a Accesos
        </Link>
      </main>
    );
  }

  return <InviteMemberScreen slug={slug} />;
}
