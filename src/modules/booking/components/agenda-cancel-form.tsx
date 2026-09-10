"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(cancelAppointmentAction, undefined);

  useEffect(() => {
    if (state?.message && !state.ok) {
      dialogRef.current?.showModal();
    }
  }, [state]);

  function openConfirm() {
    dialogRef.current?.showModal();
  }

  function closeConfirm() {
    if (pending) {
      return;
    }
    dialogRef.current?.close();
  }

  return (
    <>
      <Button
        type="button"
        variant={appearance === "link" ? "ghost" : "secondary"}
        className={
          appearance === "link"
            ? "text-destructive hover:text-destructive h-auto cursor-pointer gap-1.5 px-1 py-1 text-[13px] font-semibold"
            : "h-10 min-h-10 cursor-pointer"
        }
        disabled={pending}
        onClick={openConfirm}
      >
        {appearance === "link" ? <Trash2 className="size-3.5" strokeWidth={2} /> : null}
        {pending ? "Cancelando…" : "Cancelar"}
      </Button>

      <dialog
        ref={dialogRef}
        className="bg-card text-foreground fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-5 shadow-xl backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeConfirm();
          }
        }}
        onCancel={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <h3 className="text-xl font-bold tracking-tight">Cancelar turno</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          ¿Estás seguro que deseás cancelar este turno? Esta acción no se puede deshacer.
        </p>

        <form action={formAction} className="mt-4 grid gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="professionalId" value={professionalId} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="appointmentId" value={appointmentId} />

          {state?.message && !state.ok ? (
            <p className="text-destructive text-sm">{state.message}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer rounded-xl px-3"
              disabled={pending}
              onClick={closeConfirm}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="h-10 cursor-pointer rounded-xl px-3 font-semibold"
              disabled={pending}
            >
              {pending ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
