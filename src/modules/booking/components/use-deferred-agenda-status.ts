"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { markCompletedAction, markNoShowAction } from "@/modules/booking/adapters/inbound/actions";

export type DeferredAgendaKind = "completed" | "noShow";

export type DeferredAgendaRequest = {
  appointmentId: string;
  kind: DeferredAgendaKind;
  slug: string;
  date: string;
  professionalId: string;
  serviceId: string;
  label: string;
};

export type DeferredUndoToast = {
  appointmentId: string;
  kind: DeferredAgendaKind;
  label: string;
};

type PendingEntry = {
  kind: DeferredAgendaKind;
  timerId: number;
  request: DeferredAgendaRequest;
  scheduledAt: number;
  committing: boolean;
};

const UNDO_WINDOW_MS = 5000;

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function buildFormData(request: DeferredAgendaRequest): FormData {
  const formData = new FormData();
  formData.set("slug", request.slug);
  formData.set("date", request.date);
  formData.set("professionalId", request.professionalId);
  formData.set("serviceId", request.serviceId);
  formData.set("appointmentId", request.appointmentId);
  return formData;
}

function toastFromEntry(entry: PendingEntry): DeferredUndoToast {
  return {
    appointmentId: entry.request.appointmentId,
    kind: entry.kind,
    label: entry.request.label,
  };
}

export function useDeferredAgendaStatus() {
  const pendingRef = useRef<Map<string, PendingEntry>>(new Map());
  const [pendingById, setPendingById] = useState<Record<string, DeferredAgendaKind>>({});
  const [undoToast, setUndoToast] = useState<DeferredUndoToast | null>(null);
  const [commitError, setCommitError] = useState<string | undefined>();
  const [, startCommit] = useTransition();

  const peekLatestUndo = useCallback((): DeferredUndoToast | null => {
    let latest: PendingEntry | null = null;
    for (const entry of pendingRef.current.values()) {
      if (entry.committing) {
        continue;
      }
      if (!latest || entry.scheduledAt > latest.scheduledAt) {
        latest = entry;
      }
    }
    return latest ? toastFromEntry(latest) : null;
  }, []);

  const syncUndoToast = useCallback(() => {
    setUndoToast(peekLatestUndo());
  }, [peekLatestUndo]);

  const removePendingUi = useCallback(
    (appointmentId: string) => {
      setPendingById((current) => {
        if (!(appointmentId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[appointmentId];
        return next;
      });
      syncUndoToast();
    },
    [syncUndoToast],
  );

  const commitRequest = useCallback(
    (request: DeferredAgendaRequest) => {
      startCommit(async () => {
        setCommitError(undefined);
        const formData = buildFormData(request);
        const action = request.kind === "completed" ? markCompletedAction : markNoShowAction;
        try {
          const state = await action(undefined, formData);
          if (state && !state.ok) {
            pendingRef.current.delete(request.appointmentId);
            removePendingUi(request.appointmentId);
            setCommitError(state.message);
          }
        } catch (error) {
          if (isNextRedirectError(error)) {
            return;
          }
          pendingRef.current.delete(request.appointmentId);
          removePendingUi(request.appointmentId);
          setCommitError("No se pudo guardar el cambio. Probá de nuevo.");
          throw error;
        }
      });
    },
    [removePendingUi],
  );

  const beginCommit = useCallback(
    (appointmentId: string) => {
      const entry = pendingRef.current.get(appointmentId);
      if (!entry || entry.committing) {
        return;
      }
      entry.committing = true;
      window.clearTimeout(entry.timerId);
      syncUndoToast();
      commitRequest(entry.request);
    },
    [commitRequest, syncUndoToast],
  );

  const undo = useCallback(
    (appointmentId: string) => {
      const entry = pendingRef.current.get(appointmentId);
      if (!entry || entry.committing) {
        return;
      }
      window.clearTimeout(entry.timerId);
      pendingRef.current.delete(appointmentId);
      removePendingUi(appointmentId);
      setCommitError(undefined);
    },
    [removePendingUi],
  );

  const schedule = useCallback(
    (request: DeferredAgendaRequest) => {
      const existing = pendingRef.current.get(request.appointmentId);
      if (existing?.committing) {
        return;
      }
      if (existing) {
        window.clearTimeout(existing.timerId);
      }
      setCommitError(undefined);

      const scheduledAt = Date.now();
      const timerId = window.setTimeout(() => {
        beginCommit(request.appointmentId);
      }, UNDO_WINDOW_MS);

      pendingRef.current.set(request.appointmentId, {
        kind: request.kind,
        timerId,
        request,
        scheduledAt,
        committing: false,
      });
      setPendingById((current) => ({
        ...current,
        [request.appointmentId]: request.kind,
      }));
      setUndoToast({
        appointmentId: request.appointmentId,
        kind: request.kind,
        label: request.label,
      });
    },
    [beginCommit],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const [appointmentId, entry] of pending.entries()) {
        if (entry.committing) {
          continue;
        }
        window.clearTimeout(entry.timerId);
        entry.committing = true;
        pending.delete(appointmentId);
        void (async () => {
          const formData = buildFormData(entry.request);
          const action =
            entry.request.kind === "completed" ? markCompletedAction : markNoShowAction;
          try {
            await action(undefined, formData);
          } catch (error) {
            if (!isNextRedirectError(error)) {
              console.error(error);
            }
          }
        })();
      }
    };
  }, []);

  return {
    pendingById,
    undoToast,
    commitError,
    schedule,
    undo,
  };
}
