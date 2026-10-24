"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  formatDuration,
  formatLongDate,
  pesos,
  publicName,
  publicTheme as t,
  whatsappHref,
  type PublicAccent,
} from "@/components/shared/public-template";
import { cn } from "@/lib/utils";
import {
  confirmPublicReservationAction,
  fetchPublicDaysAction,
  fetchPublicSlotsAction,
  type PublicCatalog,
} from "@/modules/booking/adapters/inbound/public-actions";

import { useGuestProfile, writeGuestProfile } from "./guest-profile";
import { PublicDayCalendar } from "./public-day-calendar";
import { PublicSlotGroups } from "./public-slot-groups";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = 6;

const stepTitles: Record<Step, string> = {
  1: "Elegí el servicio",
  2: "¿Con quién?",
  3: "Elegí el día",
  4: "Elegí el horario",
  5: "Tus datos",
  6: "Confirmá",
};

export function PublicBookingWizard({
  slug,
  businessName,
  catalog,
  whatsappPhone,
  address,
  accent,
  initialServiceId = "",
}: {
  slug: string;
  businessName: string;
  catalog: PublicCatalog;
  whatsappPhone: string | null;
  address: string | null;
  accent: PublicAccent;
  initialServiceId?: string;
}) {
  const startsWithService = catalog.services.some((service) => service.id === initialServiceId);
  const [step, setStep] = useState<Step>(startsWithService ? 2 : 1);
  const [serviceId, setServiceId] = useState(startsWithService ? initialServiceId : "");
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const guest = useGuestProfile(slug);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const firstName = nameDraft ?? guest.firstName;
  const phone = phoneDraft ?? guest.phone;
  const [days, setDays] = useState<string[]>([]);
  const [daysPending, setDaysPending] = useState(false);
  const [dayNotice, setDayNotice] = useState<"gone" | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [state, formAction, confirming] = useActionState(confirmPublicReservationAction, undefined);
  const continueRef = useRef<HTMLButtonElement>(null);
  const daysRequest = useRef(0);

  function revealContinue() {
    const button = continueRef.current;
    if (!button) {
      return;
    }
    requestAnimationFrame(() => {
      const navHeight = document.querySelector("nav")?.getBoundingClientRect().height ?? 0;
      const limit = window.innerHeight - navHeight - 16;
      const rect = button.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= limit) {
        return;
      }
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      window.scrollTo({ top: window.scrollY + rect.bottom - limit, behavior });
    });
  }

  function setFirstName(value: string) {
    setNameDraft(value);
    writeGuestProfile(slug, { firstName: value, phone });
  }

  function setPhone(value: string) {
    setPhoneDraft(value);
    writeGuestProfile(slug, { firstName, phone: value });
  }

  const service = catalog.services.find((item) => item.id === serviceId);
  const professionals = catalog.professionals.filter((professional) =>
    professional.serviceIds.includes(serviceId),
  );
  const professional = professionals.find((item) => item.id === professionalId);

  function chooseService(id: string) {
    setServiceId(id);
    setProfessionalId(null);
    setDate("");
    setTime("");
    setDays([]);
    setSlots([]);
    setDayNotice(null);
    setDaysPending(false);
    daysRequest.current += 1;
    revealContinue();
  }

  function goNext() {
    if (step === 2) {
      setDayNotice(null);
      setDayNotice(null);
      setDaysPending(true);
      setDays([]);
      setStep(3);
      const request = daysRequest.current + 1;
      daysRequest.current = request;
      startTransition(async () => {
        try {
          const result = await fetchPublicDaysAction({
            slug,
            serviceId,
            professionalId: professionalId || null,
          });
          if (daysRequest.current === request) {
            setDays(result.days);
          }
        } finally {
          if (daysRequest.current === request) {
            setDaysPending(false);
          }
        }
      });
      return;
    }
    if (step === 3) {
      startTransition(async () => {
        const result = await fetchPublicSlotsAction({
          slug,
          professionalId: professionalId || null,
          serviceId,
          localDate: date,
        });
        if (result.slots.length === 0) {
          setDays((current) => current.filter((day) => day !== date));
          setDate("");
          setTime("");
          setDayNotice("gone");
          return;
        }
        setDayNotice(null);
        setSlots(result.slots);
        setStep(4);
      });
      return;
    }
    setStep((current) => (current < STEPS ? ((current + 1) as Step) : current));
  }

  const canContinue =
    (step === 1 && Boolean(serviceId)) ||
    (step === 2 && professionalId !== null) ||
    (step === 3 && days.includes(date)) ||
    (step === 4 && Boolean(time)) ||
    (step === 5 && firstName.trim().length > 0 && phone.trim().length > 0 && consent);

  if (state?.ok && state.localDate && state.localTime) {
    const chat = whatsappHref(whatsappPhone);
    return (
      <main className="flex min-h-svh flex-col gap-6 px-6 py-8">
        <h1
          className={cn(
            "text-4xl leading-tight",
            t.display,
            accent.text,
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:animation-duration-500 motion-safe:delay-150",
          )}
        >
          Tu turno quedó{" "}
          <span className="inline-flex items-center gap-3 align-middle whitespace-nowrap">
            reservado
            <span
              className={cn(
                "inline-flex size-12 items-center justify-center rounded-full",
                accent.solid,
                accent.glow,
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:fill-mode-both motion-safe:animation-duration-500",
              )}
              aria-hidden
            >
              <Check className="size-6" strokeWidth={2.25} />
            </span>
          </span>
        </h1>
        <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:animation-duration-500 overflow-hidden rounded-[28px] border border-[#e7e0d5]/80 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] motion-safe:delay-300">
          <p className="text-[18px] leading-snug font-semibold tracking-tight">
            {formatLongDate(state.localDate)}
          </p>
          <p className="mt-1 text-[18px] leading-snug font-semibold tracking-tight">
            {state.localTime}hs
          </p>
          <dl className={cn("mt-5 grid gap-4 border-t pt-5", t.line)}>
            <SummaryFact label="Servicio" value={publicName(state.serviceName ?? "")} />
            <SummaryFact label="Con" value={publicName(state.professionalName || "El equipo")} />
            <SummaryFact label="Dónde" value={address ?? businessName} />
          </dl>
        </section>
        <p className={cn("text-sm leading-relaxed", t.muted)}>
          Te escribimos por WhatsApp para recordártelo un día antes. Para cancelarlo o cambiar el
          horario, entrá a Mis turnos.
        </p>
        <div className="grid gap-3">
          <a href={`/${slug}/perfil/turnos`} className={t.primary}>
            Ver mis turnos
          </a>
          {chat ? (
            <a href={chat} target="_blank" rel="noreferrer" className={t.secondary}>
              Escribir por WhatsApp
            </a>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100svh-6rem)] flex-col gap-6 px-6 py-8">
      <header className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => (current - 1) as Step)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e7e0d5] bg-white pr-3.5 pl-2.5 text-sm font-medium tracking-normal text-[#1c1917] normal-case shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors hover:bg-[#f3f0eb]"
            >
              <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
              Volver
            </button>
          ) : (
            <span className={cn(t.eyebrow, t.muted)}>{businessName}</span>
          )}
          <p className="inline-flex items-baseline gap-1.5">
            <span className="text-[13px] font-medium tracking-normal text-[#78716c] normal-case">
              Paso
            </span>
            <span className={cn("text-[26px] leading-none text-[#1c1917]", t.display)}>{step}</span>
            <span className="text-[13px] font-medium tracking-normal text-[#78716c] normal-case">
              de {STEPS}
            </span>
          </p>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: STEPS }, (_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index < step ? accent.solid : "bg-[#e7e0d5]",
              )}
            />
          ))}
        </div>
        <h1 className={cn("mt-2 text-3xl", t.display)}>{stepTitles[step]}</h1>
      </header>

      {step === 1 ? (
        <section className="grid gap-2">
          {catalog.services.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={serviceId === item.id}
              onClick={() => chooseService(item.id)}
              className={serviceId === item.id ? t.choiceSelected : t.choice}
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-[18px] leading-snug font-semibold tracking-tight">
                  {publicName(item.name)}
                </span>
                <span className="text-[18px] leading-snug font-semibold tracking-tight">
                  {pesos.format(item.priceAmount)}
                </span>
              </span>
              <span className={cn("mt-1.5 block text-[15px] font-medium", t.muted)}>
                {formatDuration(item.durationMinutes)}
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-2">
          <button
            type="button"
            aria-pressed={professionalId === ""}
            onClick={() => {
              setProfessionalId("");
              setDate("");
              setTime("");
              revealContinue();
            }}
            className={professionalId === "" ? t.choiceSelected : t.choice}
          >
            <span className="block text-[18px] leading-snug font-semibold tracking-tight">
              El primer horario libre
            </span>
          </button>
          {professionals.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={professionalId === item.id}
              onClick={() => {
                setProfessionalId(item.id);
                setDate("");
                setTime("");
                revealContinue();
              }}
              className={professionalId === item.id ? t.choiceSelected : t.choice}
            >
              <span className="block text-[18px] leading-snug font-semibold tracking-tight">
                {publicName(item.displayName)}
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-2">
          {daysPending || (pending && days.length === 0) ? (
            <p className={cn("text-sm", t.muted)}>Buscando días…</p>
          ) : null}
          {!daysPending && !pending && days.length === 0 ? (
            <p className={cn("text-sm leading-relaxed", t.muted)}>
              No hay días con horario libre en las próximas cuatro semanas. Volvé y elegí otro
              profesional o servicio.
            </p>
          ) : null}
          {dayNotice === "gone" && days.length > 0 ? (
            <p className={cn("text-sm leading-relaxed", t.muted)}>
              Ese día se acaba de ocupar. Elegí otro.
            </p>
          ) : null}
          {days.length > 0 && !daysPending ? (
            <PublicDayCalendar
              key={days[0] ?? "vacio"}
              openDays={days}
              selected={date}
              accent={accent}
              onSelect={(day) => {
                setDate(day);
                setTime("");
                setDayNotice(null);
                revealContinue();
              }}
            />
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="grid gap-6">
          {date ? <p className={cn("text-sm", t.muted)}>{formatLongDate(date)}</p> : null}
          {pending ? <p className={cn("text-sm", t.muted)}>Buscando horarios…</p> : null}
          {!pending && slots.length === 0 ? (
            <p className={cn("text-sm", t.muted)}>Ese día no tiene horarios libres.</p>
          ) : null}
          <PublicSlotGroups
            slots={slots}
            time={time}
            onPick={(slot) => {
              setTime(slot);
              revealContinue();
            }}
          />
        </section>
      ) : null}

      {step === 5 ? (
        <section className="grid gap-4">
          <label className={t.label}>
            Nombre
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={100}
              autoComplete="given-name"
              className={t.input}
            />
          </label>
          <label className={t.label}>
            Teléfono
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              className={t.input}
            />
          </label>
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                revealContinue();
              }}
              className="mt-1 size-4 accent-[#1c1917]"
            />
            <span>
              Te escribimos por WhatsApp para confirmar el turno y recordártelo un día antes. No
              respondas ese mensaje: para cambios, llamá al negocio.
            </span>
          </label>
        </section>
      ) : null}

      {step === 6 ? (
        <form action={formAction} className="grid gap-6">
          <section className="overflow-hidden rounded-[28px] border border-[#e7e0d5]/80 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <p className="text-[18px] leading-snug font-semibold tracking-tight">
              {date ? formatLongDate(date) : ""}
            </p>
            <p className="mt-1 text-[18px] leading-snug font-semibold tracking-tight">
              {time ? `${time}hs` : ""}
            </p>
            <dl className={cn("mt-5 grid gap-4 border-t pt-5", t.line)}>
              <SummaryFact label="Servicio" value={publicName(service?.name ?? "")} />
              <SummaryFact
                label="Con"
                value={publicName(professional?.displayName ?? "El equipo")}
              />
              {service ? (
                <SummaryFact label="Precio" value={pesos.format(service.priceAmount)} />
              ) : null}
              <SummaryFact label="A nombre de" value={firstName} />
            </dl>
          </section>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="professionalId" value={professionalId ?? ""} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="firstName" value={firstName} />
          <input type="hidden" name="phone" value={phone} />
          {consent ? <input type="hidden" name="whatsappConsent" value="on" /> : null}
          {state?.message ? <p className={t.error}>{state.message}</p> : null}
          <button type="submit" disabled={confirming} className={t.primary}>
            {confirming ? "Reservando…" : "Confirmar reserva"}
          </button>
        </form>
      ) : (
        <button
          ref={continueRef}
          type="button"
          onClick={goNext}
          disabled={!canContinue || pending}
          className={cn("mt-auto", t.primary)}
        >
          Continuar
        </button>
      )}
    </main>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={cn(t.eyebrow, t.muted)}>{label}</dt>
      <dd className="mt-1 text-[18px] leading-snug font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
