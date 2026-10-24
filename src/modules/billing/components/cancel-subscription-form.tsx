"use client";

import { useActionState } from "react";

import { cancelSubscriptionAction } from "@/modules/billing/adapters/inbound/actions";

export function CancelSubscriptionForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(cancelSubscriptionAction, undefined);

  return (
    <form action={formAction} className="border-border mx-4 mt-8 flex flex-col gap-2 border-t py-4">
      <p className="text-sm font-medium">Dar de baja</p>
      <label className="text-muted-foreground flex items-start gap-2 text-sm">
        <input type="checkbox" name="confirm" required className="mt-1" />
        <span>Se cancela el débito y se corta el acceso. La agenda de hoy no queda abierta.</span>
      </label>
      <input type="hidden" name="slug" value={slug} />
      {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Dar de baja la suscripción"}
      </button>
    </form>
  );
}
