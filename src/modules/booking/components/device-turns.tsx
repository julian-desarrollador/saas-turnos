"use client";

import { useState, useTransition } from "react";

import {
  formatLongDate,
  publicName,
  publicTheme as t,
  type PublicAccent,
} from "@/components/shared/public-template";
import { cn } from "@/lib/utils";
import { cancelDeviceAppointmentAction } from "@/modules/booking/adapters/inbound/device-actions";

export type DeviceTurnCard = {
  id: string;
  localDate: string;
  localTime: string;
  status: string;
  serviceName: string;
  professionalName: string;
};

export function DeviceTurns({
  slug,
  accent,
  canReschedule,
  upcoming,
  past,
}: {
  slug: string;
  accent: PublicAccent;
  canReschedule: boolean;
  upcoming: DeviceTurnCard[];
  past: DeviceTurnCard[];
}) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const rows = tab === "upcoming" ? upcoming : past;
  const tabs = [
    { id: "upcoming", label: "Próximos" },
    { id: "past", label: "Pasados" },
  ] as const;
  return (
    <div className="grid gap-6 px-6 py-10">
      <header>
        <a href={`/${slug}/perfil`} className={cn(t.link, t.muted)}>
          Perfil
        </a>
        <h1 className={cn("mt-3 text-4xl", t.display)}>Mis turnos</h1>
      </header>
      <div className={cn("flex gap-6 border-b", t.line)} role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px border-b pb-3",
              t.eyebrow,
              tab === item.id
                ? cn("border-current", accent.text)
                : cn("border-transparent", t.muted),
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="grid gap-4">
          <p className={cn("text-sm", t.muted)}>
            {tab === "upcoming"
              ? "No hay turnos próximos reservados desde este celular."
              : "No hay turnos anteriores en este celular."}
          </p>
          {tab === "upcoming" && canReschedule ? (
            <a href={`/${slug}/reservar`} className={t.primary}>
              Reservar turno
            </a>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((appointment) => (
            <li
              key={appointment.id}
              className={cn("grid gap-3 rounded-2xl border bg-white p-5", t.line)}
            >
              <div>
                <p
                  className={cn(
                    t.eyebrow,
                    appointment.status === "CANCELLED" ? t.muted : accent.text,
                  )}
                >
                  {appointment.status === "CANCELLED" ? "Cancelado" : appointment.localTime}
                </p>
                <p className={cn("mt-1 text-2xl", t.display)}>
                  {formatLongDate(appointment.localDate)}
                </p>
                <p className={cn("mt-1 text-sm", t.muted)}>
                  {publicName(appointment.serviceName)} · {publicName(appointment.professionalName)}
                </p>
              </div>
              {tab === "upcoming" && appointment.status !== "CANCELLED" ? (
                <div className="grid grid-cols-2 gap-2">
                  {canReschedule ? (
                    <a
                      href={`/${slug}/perfil/turnos/${appointment.id}/cambiar`}
                      className={t.secondary}
                    >
                      Cambiar
                    </a>
                  ) : null}
                  <CancelButton slug={slug} appointmentId={appointment.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CancelButton({ slug, appointmentId }: { slug: string; appointmentId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-1">
      <button
        type="button"
        disabled={pending}
        className={t.secondary}
        onClick={() => {
          if (!window.confirm("¿Cancelar este turno?")) {
            return;
          }
          startTransition(async () => {
            const result = await cancelDeviceAppointmentAction(slug, appointmentId);
            setMessage(result.ok ? "" : result.message);
          });
        }}
      >
        {pending ? "Cancelando…" : "Cancelar"}
      </button>
      {message ? <p className={t.error}>{message}</p> : null}
    </div>
  );
}
