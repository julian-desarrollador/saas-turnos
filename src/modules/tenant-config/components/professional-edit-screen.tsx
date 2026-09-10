"use client";

import { CalendarClock, ChevronRight, TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { ConfirmDialog, ConfirmDialogActions } from "@/components/shared/confirm-dialog";
import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { cn } from "@/lib/utils";
import {
  saveProfessionalAction,
  setProfessionalActiveAction,
} from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  ProfessionalRecord,
  ServiceRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import { ServiceChecklist } from "@/modules/tenant-config/components/service-checklist";

export function ProfessionalEditScreen({
  slug,
  professional,
  services,
  hasSchedule,
}: {
  slug: string;
  professional: ProfessionalRecord;
  services: ServiceRecord[];
  hasSchedule: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saveState, saveAction, savePending] = useActionState(saveProfessionalAction, undefined);
  const [activeState, activeAction, activePending] = useActionState(
    setProfessionalActiveAction,
    undefined,
  );
  const [displayName, setDisplayName] = useState(professional.displayName);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const listHref = `/${slug}/professionals` as Route;
  const scheduleHref = `/${slug}/schedule/profesional/${professional.id}` as Route;
  const nextActive = !professional.isActive;

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title={professional.displayName}
      subtitle="Cambiá lo que necesites y tocá Guardar."
      continueLabel={savePending ? "Guardando…" : "Guardar"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueDisabled={displayName.trim() === ""}
      continueLoading={savePending}
    >
      <div className="grid gap-7">
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold",
              professional.isActive
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {professional.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>

        <form ref={formRef} action={saveAction} className="grid gap-7">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="professionalId" value={professional.id} />

          <div className="grid gap-2">
            <label htmlFor="professional-name" className="text-base font-semibold">
              Nombre
            </label>
            <p className="text-muted-foreground text-sm">
              Es el nombre que ven tus clientes al reservar.
            </p>
            <input
              id="professional-name"
              name="displayName"
              required
              maxLength={120}
              autoComplete="off"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
              }}
              className="border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2"
            />
          </div>

          <div className="grid gap-2">
            <p className="text-base font-semibold">Servicios que hace</p>
            <p className="text-muted-foreground text-sm">
              Marcá todos los que corresponda. Se guardan junto con el nombre.
            </p>
            <ServiceChecklist services={services} selectedIds={professional.serviceIds} />
          </div>

          {saveState?.message && !saveState.ok ? (
            <p role="alert" className="text-destructive text-sm font-medium">
              {saveState.message}
            </p>
          ) : null}
        </form>

        <div className="grid gap-2">
          <p className="text-base font-semibold">Horario de atención</p>
          {hasSchedule ? (
            <p className="text-muted-foreground text-sm">
              Ya tiene horario cargado: los turnos se ofrecen según esas franjas.
            </p>
          ) : (
            <p className="text-destructive flex items-start gap-1.5 text-sm font-medium">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
              <span>Sin horario cargado: no aparecen turnos disponibles con esta persona.</span>
            </p>
          )}
          <Link
            href={scheduleHref}
            className="border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition"
          >
            <CalendarClock className="text-muted-foreground size-5 shrink-0" strokeWidth={2.2} />
            <span className="min-w-0 flex-1 text-base font-semibold">
              {hasSchedule ? "Ver o cambiar el horario" : "Cargar el horario"}
            </span>
            <ChevronRight className="text-muted-foreground size-5 shrink-0" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="border-border grid gap-2 border-t pt-6">
          <p className="text-base font-semibold">
            {professional.isActive ? "Dejar de ofrecer turnos" : "Volver a ofrecer turnos"}
          </p>
          <p className="text-muted-foreground text-sm">
            {professional.isActive
              ? "Una persona inactiva no se ofrece para turnos nuevos. Los turnos ya reservados no se tocan."
              : "Al activarla vuelve a ofrecerse para turnos nuevos según su horario."}
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(true);
            }}
            className={cn(
              "h-12 cursor-pointer rounded-2xl border text-base font-semibold transition",
              professional.isActive
                ? "border-destructive/40 text-destructive hover:bg-destructive/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            {professional.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        pending={activePending}
        onClose={() => {
          setConfirmOpen(false);
        }}
        title={
          professional.isActive
            ? `¿Desactivar a ${professional.displayName}?`
            : `¿Activar a ${professional.displayName}?`
        }
        description={
          professional.isActive
            ? "Deja de ofrecerse para turnos nuevos. Los turnos ya reservados siguen igual."
            : "Vuelve a ofrecerse para turnos nuevos según el horario que tenga cargado."
        }
      >
        <form action={activeAction} className="mt-5 grid gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="professionalId" value={professional.id} />
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
            confirmLabel={professional.isActive ? "Sí, desactivar" : "Sí, activar"}
            pending={activePending}
            destructive={professional.isActive}
          />
        </form>
      </ConfirmDialog>
    </PanelFormShell>
  );
}
