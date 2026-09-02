"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServiceAction } from "@/modules/tenant-config/adapters/inbound/actions";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

export function ServiceCreateForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(createServiceAction, undefined);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-1.5">
        <Label htmlFor="service-name">Nombre</Label>
        <Input id="service-name" name="name" required maxLength={120} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="service-duration">Duración (minutos)</Label>
          <Input
            id="service-duration"
            name="durationMinutes"
            type="number"
            min={1}
            step={1}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="service-price">Precio (ARS)</Label>
          <Input id="service-price" name="priceAmount" type="number" min={0} step={1} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="service-prep">Preparación (minutos)</Label>
          <Input
            id="service-prep"
            name="prepMinutes"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="service-cleanup">Limpieza (minutos)</Label>
          <Input
            id="service-cleanup"
            name="cleanupMinutes"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="service-earliest">Inicio más temprano</Label>
          <Input id="service-earliest" name="earliestStart" placeholder="09:00" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="service-latest">Inicio más tardío</Label>
          <Input id="service-latest" name="latestStart" placeholder="18:00" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="requiresDeposit" className="size-4" />
        Exige seña
      </label>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar servicio"}
      </Button>
    </form>
  );
}
