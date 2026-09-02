"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppointmentAction } from "@/modules/booking/adapters/inbound/actions";

export function AgendaBookingForm({
  slug,
  date,
  professionalId,
  serviceId,
  time,
  professionalName,
  serviceName,
}: {
  slug: string;
  date: string;
  professionalId: string;
  serviceId: string;
  time: string;
  professionalName: string;
  serviceName: string;
}) {
  const [state, formAction, pending] = useActionState(createAppointmentAction, undefined);

  return (
    <form action={formAction} className="mb-8 grid max-w-md gap-3 rounded-lg border p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="time" value={time} />
      <p className="text-sm">
        {serviceName} con {professionalName} a las {time}.
      </p>
      <div className="grid gap-1.5">
        <Label htmlFor="agenda-phone">Teléfono</Label>
        <Input
          id="agenda-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+54 9 11 2345-6789"
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="agenda-name">Nombre (opcional)</Label>
        <Input
          id="agenda-name"
          name="firstName"
          maxLength={100}
          autoComplete="given-name"
          className="h-10"
        />
      </div>
      {state?.message && !state.ok ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar turno"}
      </Button>
    </form>
  );
}
