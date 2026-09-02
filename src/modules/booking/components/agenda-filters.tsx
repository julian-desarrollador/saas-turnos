"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "border-input h-10 min-h-10 w-full rounded-lg border bg-transparent px-2.5 text-sm";

export function AgendaFilters({
  slug,
  date,
  professionalId,
  serviceId,
  professionals,
  services,
}: {
  slug: string;
  date: string;
  professionalId: string;
  serviceId: string;
  professionals: { id: string; displayName: string }[];
  services: { id: string; name: string }[];
}) {
  return (
    <form
      key={`${date}-${professionalId}-${serviceId}`}
      method="get"
      action={`/${slug}/agenda/nuevo`}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="agenda-date">Día</Label>
        <Input
          id="agenda-date"
          name="date"
          type="date"
          required
          defaultValue={date}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="agenda-professional">Profesional</Label>
        <select
          id="agenda-professional"
          name="professional"
          required
          defaultValue={professionalId}
          className={selectClass}
        >
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="agenda-service">Servicio</Label>
        <select
          id="agenda-service"
          name="service"
          required
          defaultValue={serviceId}
          className={selectClass}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="h-10 w-full xl:w-auto">
        Ver horarios
      </Button>
    </form>
  );
}
