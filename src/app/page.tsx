import Link from "next/link";
import type { Route } from "next";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Turnos</h1>
      <p className="text-muted-foreground text-sm">
        Base del proyecto lista. Todavía no hay funcionalidad de negocio.
      </p>
      <Show when="signed-out">
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
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <Link
            href={"/demo/dashboard" as Route}
            className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
          >
            Ir al panel demo
          </Link>
          <UserButton />
        </div>
      </Show>
    </main>
  );
}
