"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { FeedbackToast, ToastShell } from "@/components/shared/feedback-toast";
import type { DeferredAgendaKind } from "@/modules/booking/components/use-deferred-agenda-status";

export type AgendaFeedbackKind =
  "booked" | "cancelled" | "rescheduled" | "noShow" | "completed" | "blocked";

export type BlockedToastDetail = {
  who: string | null;
  from: string | null;
  to: string | null;
  startTime: string | null;
  endTime: string | null;
};

function formatDayMonth(isoDate: string): string {
  const month = isoDate.slice(5, 7);
  const day = isoDate.slice(8, 10);
  if (!month || !day) {
    return isoDate;
  }
  return `${day}/${month}`;
}

export function blockedToastMessage(detail: BlockedToastDetail): string {
  const from = detail.from ? formatDayMonth(detail.from) : null;
  const to =
    detail.to && detail.from && detail.to !== detail.from ? formatDayMonth(detail.to) : null;
  const datePart = from && to ? `${from} – ${to}` : from;
  const timePart =
    detail.startTime && detail.endTime ? `${detail.startTime}–${detail.endTime}` : "Día completo";
  const parts = [detail.who, datePart, timePart].filter((part): part is string => Boolean(part));
  if (!detail.who && !datePart) {
    return "Horario bloqueado";
  }
  return `Horario bloqueado · ${parts.join(" · ")}`;
}

const MESSAGES: Record<Exclude<AgendaFeedbackKind, "blocked">, string> = {
  booked: "Turno confirmado",
  cancelled: "Turno cancelado",
  rescheduled: "Turno reprogramado",
  noShow: "Ausencia registrada",
  completed: "Turno marcado como atendido",
};

function undoToastMessage(kind: DeferredAgendaKind, label: string): string {
  const prefix = kind === "completed" ? "Atendido" : "Ausencia";
  return `${prefix} · ${label}`;
}

const FEEDBACK_QUERY_KEYS = [
  "booked",
  "cancelled",
  "rescheduled",
  "noShow",
  "completed",
  "blocked",
  "blockFrom",
  "blockTo",
  "blockStart",
  "blockEnd",
  "blockWho",
] as const;

function resolveKind(flags: {
  booked: boolean;
  cancelled: boolean;
  rescheduled: boolean;
  noShow: boolean;
  completed: boolean;
  blocked: boolean;
}): AgendaFeedbackKind | null {
  if (flags.cancelled) {
    return "cancelled";
  }
  if (flags.booked) {
    return "booked";
  }
  if (flags.rescheduled) {
    return "rescheduled";
  }
  if (flags.noShow) {
    return "noShow";
  }
  if (flags.completed) {
    return "completed";
  }
  if (flags.blocked) {
    return "blocked";
  }
  return null;
}

export function AgendaFeedbackToast({
  booked,
  cancelled,
  rescheduled,
  noShow,
  completed,
  blocked,
  blockedDetail,
}: {
  booked: boolean;
  cancelled: boolean;
  rescheduled: boolean;
  noShow: boolean;
  completed: boolean;
  blocked: boolean;
  blockedDetail: BlockedToastDetail | null;
}) {
  const [message] = useState(() => {
    const kind = resolveKind({ booked, cancelled, rescheduled, noShow, completed, blocked });
    if (!kind) {
      return null;
    }
    if (kind !== "blocked") {
      return MESSAGES[kind];
    }
    return blockedToastMessage(
      blockedDetail ?? {
        who: null,
        from: null,
        to: null,
        startTime: null,
        endTime: null,
      },
    );
  });

  return <FeedbackToast message={message} queryKeys={FEEDBACK_QUERY_KEYS} />;
}

export function AgendaUndoToast({
  kind,
  label,
  onUndo,
}: {
  kind: DeferredAgendaKind;
  label: string;
  onUndo: () => void;
}) {
  const [entered, setEntered] = useState(false);

  // La animación de entrada se reinicia por `key` en quien lo renderiza.
  useEffect(() => {
    const enterFrame = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => {
      window.cancelAnimationFrame(enterFrame);
    };
  }, []);

  return (
    <ToastShell entered={entered} interactive>
      <Check className="size-4 shrink-0" strokeWidth={2.5} />
      <span className="min-w-0 truncate">{undoToastMessage(kind, label)}</span>
      <button
        type="button"
        onClick={onUndo}
        className="text-background ml-1 shrink-0 cursor-pointer rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold tracking-wide uppercase underline-offset-2 hover:bg-white/25"
      >
        Deshacer
      </button>
    </ToastShell>
  );
}
