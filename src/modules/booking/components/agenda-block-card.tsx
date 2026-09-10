"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import { deleteCalendarBlockAction } from "@/modules/tenant-config/adapters/inbound/actions";

function blockScope(block: MonthBlockRecord): string {
  if (block.professionalName) {
    return block.professionalName;
  }
  if (block.branchName) {
    return block.branchName;
  }
  return "Sucursal";
}

function blockTimeLabel(block: MonthBlockRecord): string {
  if (block.startTime && block.endTime) {
    return `${block.startTime}–${block.endTime}`;
  }
  return "Día completo";
}

export function AgendaBlockCard({
  slug,
  block,
  canWrite,
  onRemoved,
}: {
  slug: string;
  block: MonthBlockRecord;
  canWrite: boolean;
  onRemoved: (blockId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const removedRef = useRef(false);
  const [state, formAction, pending] = useActionState(deleteCalendarBlockAction, undefined);
  const label = blockScope(block);

  useEffect(() => {
    if (state?.ok && !removedRef.current) {
      removedRef.current = true;
      dialogRef.current?.close();
      onRemoved(block.id);
    }
    if (state?.message && !state.ok) {
      dialogRef.current?.showModal();
    }
  }, [state, block.id, onRemoved]);

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
    <article className="border-border bg-card rounded-xl border px-3.5 py-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="bg-muted text-foreground shrink-0 rounded-full px-2.5 py-1 text-sm leading-none font-semibold tracking-tight tabular-nums">
            {blockTimeLabel(block)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{label}</p>
            {block.reason ? (
              <p className="text-muted-foreground mt-1 truncate text-sm">{block.reason}</p>
            ) : null}
          </div>
        </div>

        {canWrite ? (
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-auto shrink-0 cursor-pointer px-1 py-1 text-sm font-semibold"
            disabled={pending}
            onClick={openConfirm}
          >
            {pending ? "Quitando…" : "Quitar"}
          </Button>
        ) : null}
      </div>

      {canWrite ? (
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
          <h3 className="text-xl font-bold tracking-tight">Quitar bloqueo</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            ¿Estás seguro que deseás quitar el bloqueo de {label}? Esta acción no se puede deshacer.
          </p>

          <form action={formAction} className="mt-4 grid gap-3">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="blockId" value={block.id} />

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
                {pending ? "Quitando…" : "Sí, quitar"}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </article>
  );
}
