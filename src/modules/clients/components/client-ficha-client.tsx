"use client";

import { ChevronLeft, FileText, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveClientFichaAction } from "@/modules/clients/adapters/inbound/actions";
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
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) {
    return localDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

const identityInputClassName =
  "border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2";

function IdentityEditForm({
  slug,
  from,
  date,
  client,
  initial,
  visitsLabel,
  onCancel,
}: {
  slug: string;
  from?: string;
  date?: string;
  client: ClientFicha;
  initial: string;
  visitsLabel: string;
  onCancel: () => void;
}) {
  const [draftFirstName, setDraftFirstName] = useState(client.firstName ?? "");
  const [draftPhone, setDraftPhone] = useState(client.phone);
  const [saveState, saveAction, savePending] = useActionState(saveClientFichaAction, undefined);

  return (
    <form action={saveAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="clientId" value={client.id} />
      {from ? <input type="hidden" name="from" value={from} /> : null}
      {date ? <input type="hidden" name="date" value={date} /> : null}

      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="bg-muted text-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold tracking-tight"
        >
          {initial}
        </span>
        <p className="text-muted-foreground text-[13px]">{visitsLabel}</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="client-first-name" className="text-[14px] font-semibold">
          Nombre
        </label>
        <input
          id="client-first-name"
          name="firstName"
          maxLength={100}
          autoComplete="given-name"
          value={draftFirstName}
          onChange={(event) => setDraftFirstName(event.target.value)}
          placeholder="Como figura en el turno"
          className={identityInputClassName}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="client-phone" className="text-[14px] font-semibold">
          Teléfono
        </label>
        <input
          id="client-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          value={draftPhone}
          onChange={(event) => setDraftPhone(event.target.value)}
          placeholder="+54 9 11 2345-6789"
          className={identityInputClassName}
        />
      </div>

      {saveState?.message && !saveState.ok ? (
        <p role="alert" className="text-destructive text-sm font-medium">
          {saveState.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={savePending || draftPhone.trim() === ""}
          className="bg-primary text-primary-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savePending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={savePending}
          className="border-border bg-card text-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ClientFichaClient({
  slug,
  from,
  date,
  backHref,
  backAriaLabel,
  client,
  appointments,
  hasMoreAppointments,
  appointmentLimit,
  canWrite,
}: {
  slug: string;
  from?: string;
  date?: string;
  backHref: Route;
  backAriaLabel: string;
  client: ClientFicha;
  appointments: ClientAppointmentRecord[];
  hasMoreAppointments: boolean;
  appointmentLimit: number;
  canWrite: boolean;
}) {
  const name = clientDisplayName(client);
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  const waUrl = whatsAppChatUrl(client.phone);
  const visitCount = appointments.length;
  const visitsLabel =
    visitCount === 0
      ? "Sin visitas"
      : `${visitCount}${hasMoreAppointments ? "+" : ""} ${visitCount === 1 ? "visita" : "visitas"}`;
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [editingIdentity, setEditingIdentity] = useState(false);

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
    <div className="bg-muted/50 min-h-[calc(100dvh-8rem)]">
      <main className="mx-auto max-w-md px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <header className="mb-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Link
              href={backHref}
              aria-label={backAriaLabel}
              className="border-border bg-card hover:bg-background flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </Link>
            <p className="text-muted-foreground text-[12px] font-medium tracking-[0.12em] uppercase">
              Ficha del cliente
            </p>
          </div>

          <div className="border-border bg-card rounded-[24px] border p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            {editingIdentity ? (
              <IdentityEditForm
                slug={slug}
                from={from}
                date={date}
                client={client}
                initial={initial}
                visitsLabel={visitsLabel}
                onCancel={() => setEditingIdentity(false)}
              />
            ) : (
              <>
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden
                    className="bg-muted text-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold tracking-tight"
                  >
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[20px] leading-tight font-bold tracking-tight">
                      {name}
                    </h1>
                    <p className="text-muted-foreground mt-1 truncate text-[13px]">
                      {client.phone}
                      <span className="text-muted-foreground/50 mx-1.5">·</span>
                      {visitsLabel}
                    </p>
                  </div>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => setEditingIdentity(true)}
                      className="border-border bg-card hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border px-3 py-2 text-[13px] font-medium shadow-sm"
                    >
                      <Pencil className="size-3.5" strokeWidth={2} />
                      Editar
                    </button>
                  ) : null}
                </div>

                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#128C7E]/25 bg-[#128C7E]/10 text-[14px] font-semibold text-[#128C7E] transition hover:bg-[#128C7E]/15"
                  >
                    <WhatsAppIcon className="size-4" />
                    Enviar WhatsApp
                  </a>
                ) : null}
              </>
            )}
          </div>
        </header>

        {client.notes ? (
          <div className="border-border bg-card mb-5 rounded-[24px] border px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Notas del cliente
            </p>
            <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap">{client.notes}</p>
          </div>
        ) : null}

        <section className="space-y-4 pb-8">
          <p className="text-muted-foreground text-[13px] font-semibold tracking-wide uppercase">
            Historial de visitas
          </p>

          {visits.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-[15px]">
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
                      <p className="text-[16px] font-semibold tracking-tight">
                        {visit.serviceName}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[14px]">
                        {formatVisitDate(visit.localDate)} · {visit.localTime} hs
                      </p>
                      <p className="text-muted-foreground/70 mt-0.5 text-[13px]">
                        {visit.professionalName}
                      </p>
                      <p className="text-muted-foreground/60 mt-1 text-[12px]">
                        {visitStatusLabel(visit.status)}
                      </p>
                    </div>
                    {canWrite && !isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(visit.id, visit.technicalNote)}
                        className="border-border bg-card hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border px-3 py-2 text-[13px] font-medium shadow-sm"
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
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                        {visit.technicalNote}
                      </p>
                    </div>
                  ) : null}

                  {!isEditing && !visit.technicalNote ? (
                    <p className="text-muted-foreground/70 mt-3 text-[13px]">
                      Sin ficha técnica para esta visita.
                    </p>
                  ) : null}

                  {isEditing ? (
                    <div className="border-border mt-3 border-t pt-3">
                      <label htmlFor={`note-${visit.id}`} className="text-[14px] font-semibold">
                        Ficha técnica
                      </label>
                      <textarea
                        id={`note-${visit.id}`}
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.target.value)}
                        rows={5}
                        placeholder="Ej: Color 20% rojo suave, oxidante 20 vol, 35 min…"
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 min-h-[120px] w-full resize-y rounded-xl border px-3 py-2.5 text-[14px] outline-none focus-visible:ring-[3px]"
                      />
                      <p className="text-muted-foreground mt-2 text-xs">
                        Vista previa de UI: todavía no se guarda en el servidor.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveNote(visit.id)}
                          className="bg-primary text-primary-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold shadow-sm"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="border-border bg-card text-foreground flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border text-[15px] font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
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
    </div>
  );
}
