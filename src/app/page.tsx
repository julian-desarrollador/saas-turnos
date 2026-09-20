import Link from "next/link";
import type { Route } from "next";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { loadPlatformHome } from "@/server/auth";

export default async function HomePage() {
  const home = await loadPlatformHome();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Turnos</h1>
      <p className="text-muted-foreground text-sm">
        Base del proyecto lista. Todavía no hay funcionalidad de negocio.
      </p>
      {home.signedIn ? (
        <div className="flex max-w-md flex-col items-center gap-3">
          {home.canOpenDemo ? (
            <Link
              href={"/demo/agenda" as Route}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
            >
              Ir al panel demo
            </Link>
          ) : (
            <p className="text-muted-foreground text-sm">
              Esta cuenta no tiene acceso a Peluquería Demo. El seed otorga OWNER al usuario de{" "}
              <code className="text-foreground">CLERK_DEV_USER_ID</code>. Copiá el User ID de esta
              cuenta (Clerk Dashboard → Users) en{" "}
              <code className="text-foreground">.env.local</code> y corré{" "}
              <code className="text-foreground">pnpm db:seed</code>.
            </p>
          )}
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
    </main>
  );
}
