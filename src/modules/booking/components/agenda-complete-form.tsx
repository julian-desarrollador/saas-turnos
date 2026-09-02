"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { markCompletedAction } from "@/modules/booking/adapters/inbound/actions";

export function AgendaCompleteForm({
  slug,
  date,
  professionalId,
  serviceId,
  appointmentId,
  appearance = "default",
}: {
  slug: string;
  date: string;
  professionalId: string;
  serviceId: string;
  appointmentId: string;
  appearance?: "default" | "card";
}) {
  const [state, formAction, pending] = useActionState(markCompletedAction, undefined);

  return (
    <form action={formAction} className="grid gap-1">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Button
        type="submit"
        variant={appearance === "card" ? "outline" : "secondary"}
        className={
          appearance === "card"
            ? "h-11 w-full rounded-xl text-[15px] font-semibold"
            : "h-10 min-h-10"
        }
        disabled={pending}
      >
        {pending ? "Marcando…" : "Atendido"}
      </Button>
      {state?.message && !state.ok ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
    </form>
  );
}
