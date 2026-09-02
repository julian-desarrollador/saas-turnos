"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCalendarBlockAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  BranchRecord,
  ProfessionalRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

export function CalendarBlockForm({
  slug,
  branches,
  professionals,
}: {
  slug: string;
  branches: BranchRecord[];
  professionals: ProfessionalRecord[];
}) {
  const [state, formAction, pending] = useActionState(createCalendarBlockAction, undefined);
  const defaultOwner =
    professionals[0] != null
      ? `professional:${professionals[0].id}`
      : branches[0] != null
        ? `branch:${branches[0].id}`
        : "";

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-1.5">
        <Label htmlFor="block-owner">Agenda</Label>
        <select
          id="block-owner"
          name="owner"
          required
          defaultValue={defaultOwner}
          className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={`branch:${branch.id}`}>
              Sucursal · {branch.name}
            </option>
          ))}
          {professionals.map((professional) => (
            <option key={professional.id} value={`professional:${professional.id}`}>
              Equipo · {professional.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="block-start-date">Desde</Label>
          <Input id="block-start-date" name="startDate" type="date" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="block-end-date">Hasta</Label>
          <Input id="block-end-date" name="endDate" type="date" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="block-start-time">Hora inicio (opcional)</Label>
          <Input id="block-start-time" name="startTime" type="time" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="block-end-time">Hora fin (opcional)</Label>
          <Input id="block-end-time" name="endTime" type="time" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="block-reason">Motivo (opcional)</Label>
        <Input id="block-reason" name="reason" maxLength={255} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar bloqueo"}
      </Button>
    </form>
  );
}
