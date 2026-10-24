import Link from "next/link";
import type { Route } from "next";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { panelPath } from "@/core/panel-routes";

import { LegalLinks } from "@/app/legal-links";
import { loadPlatformHome } from "@/server/auth";

export default async function HomePage() {
  const home = await loadPlatformHome();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Turnos</h1>
      <p className="text-muted-foreground text-sm">Agenda, reserva pública y un mes de prueba.</p>
      {home.signedIn ? (
        <div className="flex max-w-md flex-col items-center gap-3">
          {home.businesses.map((business) => (
            <Link
              key={business.slug}
              href={`${panelPath(business.slug, "agenda")}` as Route}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
            >
              {business.name}
            </Link>
          ))}
          <Link href={"/alta" as Route} className="rounded-md border px-4 py-2 text-sm font-medium">
            Abrir un negocio
          </Link>
          <UserButton />
        </div>
      ) : (
        <div className="flex gap-3">
          <SignInButton>
            <button
              type="button"
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
            >
              Iniciar sesión
            </button>
          </SignInButton>
          <SignUpButton>
            <button type="button" className="rounded-md border px-4 py-2 text-sm font-medium">
              Crear cuenta
            </button>
          </SignUpButton>
        </div>
      )}
      <LegalLinks />
    </main>
  );
}
