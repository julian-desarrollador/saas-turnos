"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { cancelAppointmentAction } from "@/modules/booking/adapters/inbound/actions";

export function AgendaCancelForm({
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
  appearance?: "default" | "link";
}) {
  const [state, formAction, pending] = useActionState(cancelAppointmentAction, undefined);

  return (
    <form action={formAction} className="grid gap-1">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Button
        type="submit"
        variant={appearance === "link" ? "ghost" : "secondary"}
        className={
          appearance === "link"
            ? "text-destructive hover:text-destructive h-auto gap-1.5 px-1 py-1 text-[13px] font-semibold"
            : "h-10 min-h-10"
        }
        disabled={pending}
      >
        {appearance === "link" ? <Trash2 className="size-3.5" strokeWidth={2} /> : null}
        {pending ? "Cancelando…" : "Cancelar"}
      </Button>
      {state?.message && !state.ok ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
    </form>
  );
}
