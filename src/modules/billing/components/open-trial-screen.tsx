"use client";

import { useActionState } from "react";

import { LegalLinks } from "@/app/legal-links";
import { openTrialAction } from "@/modules/billing/adapters/inbound/actions";
import { planOptions } from "@/modules/billing/adapters/inbound/messages";

export function OpenTrialScreen() {
  const [state, formAction, pending] = useActionState(openTrialAction, undefined);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Abrir un negocio</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Un mes de prueba sin tarjeta. Después pagás en pesos: débito automático, mes a mes o el
          año completo pagando 10 meses.
        </p>
      </header>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nombre
          <input
            name="name"
            required
            maxLength={120}
            autoComplete="organization"
            className="border-border rounded-md border px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Enlace
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="peluqueria-ana"
            className="border-border rounded-md border px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Teléfono del negocio
          <input
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 1234 5678"
            className="border-border rounded-md border px-3 py-2 font-normal"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Plan</legend>
          {planOptions.map((plan) => (
            <label
              key={plan.id}
              className="border-border flex items-start gap-2 rounded-md border p-3"
            >
              <input type="radio" name="plan" value={plan.id} required className="mt-1" />
              <span>
                <span className="block text-sm font-medium">{plan.label}</span>
                <span className="text-muted-foreground block text-sm">{plan.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Creando…" : "Empezar la prueba"}
        </button>
      </form>
      <LegalLinks />
    </main>
  );
}
