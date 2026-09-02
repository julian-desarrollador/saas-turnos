"use client";

import { ChevronLeft, FileText, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { clientDisplayName } from "@/modules/clients/adapters/inbound/messages";
import type {
  ClientAppointmentRecord,
  ClientAppointmentStatus,
  ClientFicha,
} from "@/modules/clients/application/ports/client-repository";
import { whatsAppChatUrl } from "@/modules/clients/domain/phone";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function visitStatusLabel(status: ClientAppointmentStatus): string {
  switch (status) {
    case "CANCELLED":
      return "Cancelada";
    case "COMPLETED":
      return "Realizada";
    case "NO_SHOW":
      return "No asistió";
    case "IN_PROGRESS":
      return "En curso";
    case "PENDING":
      return "Pendiente";
    default:
      return "Confirmada";
  }
}

function formatVisitDate(localDate: string): string {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function ClientFichaClient({
  slug,
  client,
  appointments,
  hasMoreAppointments,
  appointmentLimit,
  canWrite,
}: {
  slug: string;
  client: ClientFicha;
  appointments: ClientAppointmentRecord[];
  hasMoreAppointments: boolean;
  appointmentLimit: number;
  canWrite: boolean;
}) {
  const name = clientDisplayName(client);
  const waUrl = whatsAppChatUrl(client.phone);
  const visitCount = appointments.length;
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const visits = useMemo(
    () =>
      appointments.map((appointment) => ({
        ...appointment,
        technicalNote: draftNotes[appointment.id] ?? null,
      })),
    [appointments, draftNotes],
  );

  function startEdit(visitId: string, current: string | null) {
    setEditingId(visitId);
    setDraftNote(current ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftNote("");
  }

  function saveNote(visitId: string) {
    const trimmed = draftNote.trim();
    setDraftNotes((prev) => {
      const next = { ...prev };
      if (trimmed) {
        next[visitId] = trimmed;
      } else {
        delete next[visitId];
      }
      return next;
    });
    setEditingId(null);
    setDraftNote("");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="mb-5 flex items-start gap-3">
        <Link
          href={`/${slug}/clients` as Route}
          aria-label="Volver a clientes"
          className="border-border bg-card hover:bg-muted flex size-10 shrink-0 items-center justify-center rounded-2xl border"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[12px] font-medium tracking-[0.12em] uppercase">
            Ficha del cliente
          </p>
          <h1 className="mt-0.5 text-[22px] leading-tight font-bold">{name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{client.phone}</p>
          <p className="text-muted-foreground/80 mt-1 text-[13px]">
            {visitCount === 0
              ? "Sin visitas registradas"
              : `${visitCount}${hasMoreAppointments ? "+" : ""} ${visitCount === 1 ? "visita" : "visitas"} registradas`}
          </p>
        </div>
      </header>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[#128C7E] underline-offset-2 hover:underline"
        >
          <WhatsAppIcon className="size-4" />
          Enviar WhatsApp
        </a>
      ) : null}

      {client.notes ? (
        <div className="border-border bg-card mb-4 rounded-[24px] border px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Notas del cliente
          </p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{client.notes}</p>
        </div>
      ) : null}

      <section className="space-y-4 pb-8">
        <p className="text-muted-foreground text-[13px] font-semibold tracking-wide uppercase">
          Historial de visitas
        </p>

        {visits.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-[15px]">
            Todavía no tiene turnos en este negocio.
          </p>
        ) : (
          visits.map((visit) => {
            const isEditing = editingId === visit.id;
            return (
              <article
                key={visit.id}
                className="border-border bg-card overflow-hidden rounded-[24px] border p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold">{visit.serviceName}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formatVisitDate(visit.localDate)} · {visit.localTime} hs
                    </p>
                    <p className="text-muted-foreground/80 mt-1 text-xs">
                      {visit.professionalName} · {visitStatusLabel(visit.status)}
                    </p>
                  </div>
                  {canWrite && !isEditing ? (
                    <button
                      type="button"
                      onClick={() => startEdit(visit.id, visit.technicalNote)}
                      className="border-border bg-background hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border px-3 py-2 text-[13px] font-medium"
                    >
                      <Pencil className="size-3.5" strokeWidth={2} />
                      {visit.technicalNote ? "Editar nota" : "Agregar nota"}
                    </button>
                  ) : null}
                </div>

                {!isEditing && visit.technicalNote ? (
                  <div className="border-primary/20 bg-primary/5 mt-3 rounded-xl border px-3 py-3">
                    <p className="text-primary mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
                      <FileText className="size-3.5" strokeWidth={2} />
                      Ficha técnica
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {visit.technicalNote}
                    </p>
                  </div>
                ) : null}

                {!isEditing && !visit.technicalNote ? (
                  <p className="text-muted-foreground/80 mt-3 text-[13px]">
                    Sin ficha técnica para esta visita.
                  </p>
                ) : null}

                {isEditing ? (
                  <div className="border-border mt-3 border-t pt-3">
                    <label htmlFor={`note-${visit.id}`} className="text-sm font-semibold">
                      Ficha técnica
                    </label>
                    <textarea
                      id={`note-${visit.id}`}
                      value={draftNote}
                      onChange={(event) => setDraftNote(event.target.value)}
                      rows={5}
                      placeholder="Ej: Color 20% rojo suave, oxidante 20 vol, 35 min…"
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 min-h-[120px] w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-[3px]"
                    />
                    <p className="text-muted-foreground mt-2 text-xs">
                      Vista previa de UI: todavía no se guarda en el servidor.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveNote(visit.id)}
                        className="bg-primary text-primary-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="border-border bg-background text-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border text-[15px] font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                <Link
                  href={`/${slug}/agenda?date=${encodeURIComponent(visit.localDate)}` as Route}
                  className={cn(
                    "text-muted-foreground mt-3 inline-block text-[13px] underline-offset-4 hover:underline",
                  )}
                >
                  Ver en agenda
                </Link>
              </article>
            );
          })
        )}

        {hasMoreAppointments ? (
          <p className="text-muted-foreground text-center text-sm">
            Mostramos los {appointmentLimit} turnos más recientes.
          </p>
        ) : null}
      </section>
    </main>
  );
}
