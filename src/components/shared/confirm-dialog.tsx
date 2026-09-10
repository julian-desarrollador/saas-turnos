"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Modal de confirmación para acciones consecuentes.
 * El contenido (formulario, error y acciones) lo pone quien la usa.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  pending = false,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-card text-foreground fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-5 shadow-xl backdrop:bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
    >
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
      {children}
    </dialog>
  );
}

export function ConfirmDialogActions({
  onCancel,
  confirmLabel,
  pending = false,
  destructive = false,
}: {
  onCancel: () => void;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 cursor-pointer rounded-xl px-3"
        disabled={pending}
        onClick={onCancel}
      >
        Volver
      </Button>
      <Button
        type="submit"
        variant={destructive ? "destructive" : "default"}
        className="h-10 cursor-pointer rounded-xl px-3 font-semibold"
        disabled={pending}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
