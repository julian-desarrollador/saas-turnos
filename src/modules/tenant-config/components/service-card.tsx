"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateServiceAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type { ServiceRecord } from "@/modules/tenant-config/application/ports/catalog-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

export function ServiceCard({
  slug,
  service,
  canWrite,
}: {
  slug: string;
  service: ServiceRecord;
  canWrite: boolean;
}) {
  const [editState, editAction, editPending] = useActionState(updateServiceAction, undefined);
  const [statusState, statusAction, statusPending] = useActionState(updateServiceAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {service.durationMinutes} min · ${service.priceAmount.toLocaleString("es-AR")} ·{" "}
          {service.isActive ? "Activo" : "Inactivo"}
        </p>
      </CardHeader>
      <CardContent className="grid gap-6">
        {canWrite ? (
          <>
            <form action={editAction} className="grid gap-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="serviceId" value={service.id} />
              <input type="hidden" name="requiresDepositSubmitted" value="1" />
              <div className="grid gap-1.5">
                <Label htmlFor={`service-name-${service.id}`}>Nombre</Label>
                <Input
                  id={`service-name-${service.id}`}
                  name="name"
                  defaultValue={service.name}
                  required
                  maxLength={120}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`duration-${service.id}`}>Duración (minutos)</Label>
                  <Input
                    id={`duration-${service.id}`}
                    name="durationMinutes"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={service.durationMinutes}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`price-${service.id}`}>Precio (ARS)</Label>
                  <Input
                    id={`price-${service.id}`}
                    name="priceAmount"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={service.priceAmount}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`prep-${service.id}`}>Preparación</Label>
                  <Input
                    id={`prep-${service.id}`}
                    name="prepMinutes"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={service.prepMinutes}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`cleanup-${service.id}`}>Limpieza</Label>
                  <Input
                    id={`cleanup-${service.id}`}
                    name="cleanupMinutes"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={service.cleanupMinutes}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`earliest-${service.id}`}>Inicio más temprano</Label>
                  <Input
                    id={`earliest-${service.id}`}
                    name="earliestStart"
                    defaultValue={service.earliestStart ?? ""}
                    placeholder="09:00"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`latest-${service.id}`}>Inicio más tardío</Label>
                  <Input
                    id={`latest-${service.id}`}
                    name="latestStart"
                    defaultValue={service.latestStart ?? ""}
                    placeholder="18:00"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="requiresDeposit"
                  defaultChecked={service.requiresDeposit}
                  className="size-4"
                />
                Exige seña
              </label>
              <FormMessage state={editState} />
              <Button type="submit" disabled={editPending}>
                {editPending ? "Guardando…" : "Guardar"}
              </Button>
            </form>

            <form action={statusAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="serviceId" value={service.id} />
              <input type="hidden" name="isActive" value={service.isActive ? "false" : "true"} />
              <FormMessage state={statusState} />
              <Button type="submit" variant="secondary" disabled={statusPending}>
                {statusPending ? "Guardando…" : service.isActive ? "Desactivar" : "Activar"}
              </Button>
            </form>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
