"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { ConfirmDialog, ConfirmDialogActions } from "@/components/shared/confirm-dialog";
import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { cn } from "@/lib/utils";
import {
  saveServiceAction,
  setServiceActiveAction,
} from "@/modules/tenant-config/adapters/inbound/actions";
import type { ServiceRecord } from "@/modules/tenant-config/application/ports/catalog-repository";
import { ServiceFormFields } from "@/modules/tenant-config/components/service-form-fields";
import { moreOptionsShouldOpen } from "@/modules/tenant-config/components/service-view";

export function ServiceEditScreen({ slug, service }: { slug: string; service: ServiceRecord }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saveState, saveAction, savePending] = useActionState(saveServiceAction, undefined);
  const [activeState, activeAction, activePending] = useActionState(
    setServiceActiveAction,
    undefined,
  );
  const [name, setName] = useState(service.name);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const listHref = `/${slug}/services` as Route;
  const nextActive = !service.isActive;

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title={service.name}
      subtitle="Cambiá lo que necesites y tocá Guardar."
      continueLabel={savePending ? "Guardando…" : "Guardar"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueDisabled={name.trim() === ""}
      continueLoading={savePending}
    >
      <div className="grid gap-7">
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold",
              service.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {service.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>

        <form ref={formRef} action={saveAction} className="grid gap-7">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={service.id} />
          <ServiceFormFields
            nameId={`service-name-${service.id}`}
            nameValue={name}
            onNameChange={setName}
            durationDefault={service.durationMinutes}
            priceDefault={service.priceAmount}
            prepDefault={service.prepMinutes}
            cleanupDefault={service.cleanupMinutes}
            earliestDefault={service.earliestStart}
            latestDefault={service.latestStart}
            moreOptionsOpen={moreOptionsShouldOpen(service)}
          />
          {saveState?.message && !saveState.ok ? (
            <p role="alert" className="text-destructive text-sm font-medium">
              {saveState.message}
            </p>
          ) : null}
        </form>

        <div className="border-border grid gap-2 border-t pt-6">
          <p className="text-base font-semibold">
            {service.isActive ? "Dejar de ofrecer este servicio" : "Volver a ofrecer este servicio"}
          </p>
          <p className="text-muted-foreground text-sm">
            {service.isActive
              ? "Un servicio inactivo no se ofrece para turnos nuevos. Los turnos ya reservados no se tocan."
              : "Al activarlo vuelve a ofrecerse para turnos nuevos."}
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(true);
            }}
            className={cn(
              "h-12 cursor-pointer rounded-2xl border text-base font-semibold transition",
              service.isActive
                ? "border-destructive/40 text-destructive hover:bg-destructive/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            {service.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        pending={activePending}
        onClose={() => {
          setConfirmOpen(false);
        }}
        title={service.isActive ? `¿Desactivar ${service.name}?` : `¿Activar ${service.name}?`}
        description={
          service.isActive
            ? "Deja de ofrecerse para turnos nuevos. Los turnos ya reservados siguen igual."
            : "Vuelve a ofrecerse para turnos nuevos."
        }
      >
        <form action={activeAction} className="mt-5 grid gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="isActive" value={nextActive ? "true" : "false"} />
          {activeState?.message && !activeState.ok ? (
            <p role="alert" className="text-destructive text-sm font-medium">
              {activeState.message}
            </p>
          ) : null}
          <ConfirmDialogActions
            onCancel={() => {
              setConfirmOpen(false);
            }}
            confirmLabel={service.isActive ? "Sí, desactivar" : "Sí, activar"}
            pending={activePending}
            destructive={service.isActive}
          />
        </form>
      </ConfirmDialog>
    </PanelFormShell>
  );
}
