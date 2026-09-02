"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  setProfessionalServicesAction,
  updateProfessionalAction,
} from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  ProfessionalRecord,
  ServiceRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

export function ProfessionalCard({
  slug,
  professional,
  services,
  canWrite,
}: {
  slug: string;
  professional: ProfessionalRecord;
  services: ServiceRecord[];
  canWrite: boolean;
}) {
  const [editState, editAction, editPending] = useActionState(updateProfessionalAction, undefined);
  const [statusState, statusAction, statusPending] = useActionState(
    updateProfessionalAction,
    undefined,
  );
  const [servicesState, servicesAction, servicesPending] = useActionState(
    setProfessionalServicesAction,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{professional.displayName}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {professional.isActive ? "Activo" : "Inactivo"}
        </p>
      </CardHeader>
      <CardContent className="grid gap-6">
        {canWrite ? (
          <>
            <form action={editAction} className="grid gap-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="professionalId" value={professional.id} />
              <div className="grid gap-1.5">
                <Label htmlFor={`name-${professional.id}`}>Nombre</Label>
                <Input
                  id={`name-${professional.id}`}
                  name="displayName"
                  defaultValue={professional.displayName}
                  required
                  maxLength={120}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`color-${professional.id}`}>Color</Label>
                <Input
                  id={`color-${professional.id}`}
                  name="color"
                  defaultValue={professional.color ?? ""}
                  placeholder="#4F46E5"
                />
              </div>
              <FormMessage state={editState} />
              <Button type="submit" disabled={editPending}>
                {editPending ? "Guardando…" : "Guardar"}
              </Button>
            </form>

            <form action={servicesAction} className="grid gap-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="professionalId" value={professional.id} />
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Servicios que presta</legend>
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Todavía no hay servicios cargados.
                  </p>
                ) : (
                  services.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="serviceId"
                        value={service.id}
                        defaultChecked={professional.serviceIds.includes(service.id)}
                        className="size-4"
                      />
                      {service.name}
                    </label>
                  ))
                )}
              </fieldset>
              <FormMessage state={servicesState} />
              <Button type="submit" variant="outline" disabled={servicesPending}>
                {servicesPending ? "Guardando…" : "Guardar servicios"}
              </Button>
            </form>

            <form action={statusAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="professionalId" value={professional.id} />
              <input
                type="hidden"
                name="isActive"
                value={professional.isActive ? "false" : "true"}
              />
              <FormMessage state={statusState} />
              <Button type="submit" variant="secondary" disabled={statusPending}>
                {statusPending ? "Guardando…" : professional.isActive ? "Desactivar" : "Activar"}
              </Button>
            </form>
          </>
        ) : (
          <ul className="text-muted-foreground list-inside list-disc text-sm">
            {professional.serviceIds.length === 0 ? (
              <li>Sin servicios asignados</li>
            ) : (
              services
                .filter((service) => professional.serviceIds.includes(service.id))
                .map((service) => <li key={service.id}>{service.name}</li>)
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
