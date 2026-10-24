"use client";

import { useActionState } from "react";

import { startPaymentAction } from "@/modules/billing/adapters/inbound/actions";

export function PaymentOptionsForm({ slug, offerDebit }: { slug: string; offerDebit: boolean }) {
  const [state, formAction, pending] = useActionState(startPaymentAction, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-50 px-4 py-2 text-sm"
    >
      <input type="hidden" name="slug" value={slug} />
      {offerDebit ? (
        <button
          type="submit"
          name="method"
          value="debit"
          disabled={pending}
          className="font-medium underline disabled:opacity-60"
        >
          Débito con tarjeta de crédito (recomendado)
        </button>
      ) : null}
      <button
        type="submit"
        name="method"
        value="month"
        disabled={pending}
        className="underline disabled:opacity-60"
      >
        Pagar este mes
      </button>
      <button
        type="submit"
        name="method"
        value="year"
        disabled={pending}
        className="underline disabled:opacity-60"
      >
        Pagar el año (10 meses)
      </button>
      {state?.message ? <p className="w-full text-center text-red-600">{state.message}</p> : null}
    </form>
  );
}
