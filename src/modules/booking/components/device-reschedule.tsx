"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import {
  formatLongDate,
  publicName,
  publicTheme as t,
  type PublicAccent,
} from "@/components/shared/public-template";
import { cn } from "@/lib/utils";
import {
  fetchPublicDaysAction,
  fetchPublicSlotsAction,
} from "@/modules/booking/adapters/inbound/public-actions";
import { rescheduleDeviceAppointmentAction } from "@/modules/booking/adapters/inbound/device-actions";

import { PublicDayCalendar } from "./public-day-calendar";
import { PublicSlotGroups } from "./public-slot-groups";

export function DeviceReschedule({
  slug,
  accent,
  appointmentId,
  serviceId,
  serviceName,
  professionalId,
  professionalName,
}: {
  slug: string;
  accent: PublicAccent;
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
}) {
  const router = useRouter();
  const [anyone, setAnyone] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function loadDays(forAnyone: boolean) {
    startTransition(async () => {
      const result = await fetchPublicDaysAction({
        slug,
        serviceId,
        professionalId: forAnyone ? null : professionalId,
      });
      setDays(result.days);
    });
  }

  return (
    <div className="grid gap-6 px-6 py-10">
      <header>
        <a href={`/${slug}/perfil/turnos`} className={cn(t.link, t.muted)}>
          Mis turnos
        </a>
        <h1 className={cn("mt-3 text-4xl", t.display)}>Cambiar horario</h1>
        <p className={cn("mt-2 text-sm", t.muted)}>
          {publicName(serviceName)} ·{" "}
          {anyone ? "Cualquier profesional" : publicName(professionalName)}
        </p>
      </header>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={anyone}
          onChange={(event) => {
            const next = event.target.checked;
            setAnyone(next);
            setDate("");
            setTime("");
            setSlots([]);
            setMessage("");
            if (days.length > 0) {
              loadDays(next);
            }
          }}
          className="size-4 accent-[#1c1917]"
        />
        Me sirve cualquier profesional
      </label>
      {days.length === 0 ? (
        <button
          type="button"
          onClick={() => loadDays(anyone)}
          disabled={pending}
          className={t.primary}
        >
          {pending ? "Buscando días…" : "Ver días disponibles"}
        </button>
      ) : (
        <PublicDayCalendar
          openDays={days}
          selected={date}
          accent={accent}
          onSelect={(day) => {
            setDate(day);
            setTime("");
            setMessage("");
            startTransition(async () => {
              const result = await fetchPublicSlotsAction({
                slug,
                professionalId: anyone ? null : professionalId,
                serviceId,
                localDate: day,
              });
              if (result.slots.length === 0) {
                setDays((current) => current.filter((item) => item !== day));
                setDate("");
                setSlots([]);
                setMessage("Ese día se acaba de ocupar. Elegí otro.");
                return;
              }
              setSlots(result.slots);
            });
          }}
        />
      )}
      {date ? <p className={cn("text-sm", t.muted)}>{formatLongDate(date)}</p> : null}
      <PublicSlotGroups slots={slots} time={time} onPick={setTime} />
      {message ? <p className={t.error}>{message}</p> : null}
      {days.length > 0 ? (
        <button
          type="button"
          disabled={pending || !date || !time}
          className={t.primary}
          onClick={() => {
            startTransition(async () => {
              const result = await rescheduleDeviceAppointmentAction({
                slug,
                appointmentId,
                professionalId: anyone ? null : professionalId,
                localDate: date,
                localTime: time,
              });
              if (!result.ok) {
                setMessage(result.message);
                return;
              }
              router.push(`/${slug}/perfil/turnos` as Route);
              router.refresh();
            });
          }}
        >
          Confirmar cambio
        </button>
      ) : null}
    </div>
  );
}
