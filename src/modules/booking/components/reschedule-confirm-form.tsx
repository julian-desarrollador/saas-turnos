"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { rescheduleAppointmentAction } from "@/modules/booking/adapters/inbound/actions";

export function RescheduleConfirmForm({
  slug,
  appointmentId,
  date,
  professionalId,
  time,
  professionalName,
  serviceName,
}: {
  slug: string;
  appointmentId: string;
  date: string;
  professionalId: string;
  time: string;
  professionalName: string;
  serviceName: string;
}) {
  const [state, formAction, pending] = useActionState(rescheduleAppointmentAction, undefined);

  return (
    <form action={formAction} className="mb-8 grid max-w-md gap-3 rounded-lg border p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="time" value={time} />
      <p className="text-sm">
        Nuevo horario: {serviceName} con {professionalName} el {date} a las {time}.
      </p>
      {state?.message && !state.ok ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar nuevo horario"}
      </Button>
    </form>
  );
}
