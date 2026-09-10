"use client";

import { Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { SelectCard } from "@/components/shared/select-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createAppointmentAction,
  fetchAvailableSlotsAction,
  type ActionState,
} from "@/modules/booking/adapters/inbound/actions";
import { emptySlotsMessage } from "@/modules/booking/adapters/inbound/messages";
import type { EmptySlotsReason } from "@/modules/booking/application/offered-from-snapshot";
import type {
  AgendaProfessional,
  AgendaService,
} from "@/modules/booking/application/ports/availability-repository";
import { AgendaMonthCalendar } from "@/modules/booking/components/agenda-month-calendar";
import {
  buildMonthGrid,
  monthDateRange,
  monthTitle,
  shiftYearMonth,
  yearMonthFromDate,
} from "@/modules/booking/domain/month-grid";
import { addLocalDays, formatDurationLabel } from "@/modules/booking/domain/time";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

function formatDisplayDate(localDate: string): string {
  if (!localDate) {
    return "";
  }
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function AgendaNuevoWizard({
  slug,
  tenantName,
  today,
  initialDate,
  canWrite,
  professionals,
  services,
}: {
  slug: string;
  tenantName: string;
  today: string;
  initialDate: string;
  canWrite: boolean;
  professionals: AgendaProfessional[];
  services: AgendaService[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [professionalId, setProfessionalId] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const bookingStartDate = initialDate < today ? today : initialDate;
  const [selectedDate, setSelectedDate] = useState("");
  const [yearMonth, setYearMonth] = useState(yearMonthFromDate(bookingStartDate));
  const [selectedTime, setSelectedTime] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [emptyReason, setEmptyReason] = useState<EmptySlotsReason | null>(null);
  const [slotsError, setSlotsError] = useState<string | undefined>();
  const [slotsPending, startSlotsTransition] = useTransition();
  const [confirmState, formAction, confirmPending] = useActionState(
    createAppointmentAction,
    undefined as ActionState | undefined,
  );

  const closeHref =
    `/${slug}/agenda?date=${encodeURIComponent(selectedDate || initialDate)}` as Route;

  const professional = professionals.find((item) => item.id === professionalId) ?? null;
  const offeredServices = useMemo(() => {
    if (!professional) {
      return [];
    }
    return services.filter((service) => professional.serviceIds.includes(service.id));
  }, [professional, services]);
  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => offeredServices.find((item) => item.id === id))
        .filter((item): item is AgendaService => item != null),
    [serviceIds, offeredServices],
  );
  const primaryServiceId = serviceIds[0] ?? "";
  const totalDurationMinutes = selectedServices.reduce(
    (sum, item) => sum + item.durationMinutes,
    0,
  );
  const selectedServiceNames = selectedServices.map((item) => item.name).join(", ");

  const { year, month } = monthDateRange(yearMonth);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = monthTitle(year, month);

  const phoneOk = phone.trim().length >= 8;
  const clientOk = phoneOk;

  useEffect(() => {
    if (step !== 4 || !professionalId || !primaryServiceId || !selectedDate) {
      return;
    }
    startSlotsTransition(async () => {
      setSlots(null);
      setEmptyReason(null);
      setSlotsError(undefined);
      const payload = await fetchAvailableSlotsAction(
        slug,
        professionalId,
        primaryServiceId,
        selectedDate,
      );
      setSlots(payload.slots);
      setEmptyReason(payload.emptyReason);
      setSlotsError(payload.error);
      setSelectedTime((current) => (current && !payload.slots.includes(current) ? "" : current));
    });
  }, [step, slug, professionalId, primaryServiceId, selectedDate]);

  function clearFromProfessional() {
    setServiceIds([]);
    setSelectedTime("");
    setSlots(null);
  }

  function clearFromService() {
    setSelectedTime("");
    setSlots(null);
  }

  function onSelectProfessional(id: string) {
    if (id !== professionalId) {
      clearFromProfessional();
    }
    setProfessionalId(id);
  }

  function onToggleService(id: string) {
    const alreadySelected = serviceIds.includes(id);
    const wasPrimary = serviceIds[0] === id;
    if (alreadySelected) {
      const next = serviceIds.filter((item) => item !== id);
      setServiceIds(next);
      if (wasPrimary) {
        clearFromService();
      }
      return;
    }
    setServiceIds([...serviceIds, id]);
  }

  function onSelectDate(dateKey: string) {
    if (dateKey < today) {
      return;
    }
    setSelectedDate(dateKey);
    setSelectedTime("");
    setSlots(null);
    const targetMonth = yearMonthFromDate(dateKey);
    if (targetMonth !== yearMonth) {
      setYearMonth(targetMonth);
    }
  }

  function handleBack() {
    if (step <= 1) {
      router.push(closeHref);
      return;
    }
    setStep((prev) => (prev - 1) as WizardStep);
  }

  function handleContinue() {
    if (step === 1 && professionalId) {
      setStep(2);
      return;
    }
    if (step === 2 && serviceIds.length > 0) {
      setStep(3);
      return;
    }
    if (step === 3 && selectedDate && selectedDate >= today) {
      setStep(4);
      return;
    }
    if (step === 4 && selectedTime) {
      setStep(5);
      return;
    }
    if (step === 5 && clientOk) {
      setStep(6);
      return;
    }
    if (step === 6) {
      formRef.current?.requestSubmit();
    }
  }

  const stepMeta = (() => {
    if (step === 1) {
      return { title: "Nuevo turno", subtitle: `Elegí el profesional en ${tenantName}` };
    }
    if (step === 2) {
      return { title: "Elegí los servicios", subtitle: "Podés elegir más de uno" };
    }
    if (step === 3) {
      return { title: "Elegí la fecha", subtitle: "Seleccioná un día" };
    }
    if (step === 4) {
      return {
        title: "Elegí el horario",
        subtitle: formatDisplayDate(selectedDate) || "Horario disponible",
      };
    }
    if (step === 5) {
      return { title: "Datos del cliente", subtitle: "Para confirmar el turno en agenda" };
    }
    return { title: "Confirmar turno", subtitle: "Revisá el resumen antes de guardar" };
  })();

  const dateIsBookable = Boolean(selectedDate && selectedDate >= today);
  const continueDisabled =
    (step === 1 && !professionalId) ||
    (step === 2 && serviceIds.length === 0) ||
    (step === 3 && !dateIsBookable) ||
    (step === 4 && !selectedTime) ||
    (step === 5 && !clientOk) ||
    (step === 6 && (!clientOk || !selectedTime || !dateIsBookable || confirmPending || !canWrite));

  const continueLabel =
    step === 6 ? (confirmPending ? "Confirmando…" : "Confirmar turno") : "Continuar";

  const summary =
    step === 1 ? (
      <>
        <span className="text-muted-foreground min-w-0 flex-1 text-sm font-medium">
          {professional ? professional.displayName : "Sin profesional"}
        </span>
        {professionalId ? (
          <button
            type="button"
            onClick={() => {
              setProfessionalId("");
              clearFromProfessional();
            }}
            aria-label="Limpiar selección"
            className="border-border bg-background text-muted-foreground hover:bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl border"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        ) : null}
      </>
    ) : step === 2 ? (
      <>
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm font-medium">
          {selectedServices.length > 0
            ? `${selectedServiceNames} · ${formatDurationLabel(totalDurationMinutes)}`
            : "Sin servicio"}
        </span>
        {serviceIds.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setServiceIds([]);
              clearFromService();
            }}
            aria-label="Limpiar selección"
            className="border-border bg-background text-muted-foreground hover:bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl border"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        ) : null}
      </>
    ) : step === 3 ? (
      <>
        <span className="text-muted-foreground text-sm font-medium capitalize">
          {formatDisplayDate(selectedDate) || "Seleccioná un día"}
        </span>
        <div className="bg-primary h-1.5 w-6 shrink-0 rounded-full" />
      </>
    ) : step === 4 ? (
      <>
        <span className="text-muted-foreground text-sm font-medium capitalize">
          {formatDisplayDate(selectedDate)}
          {selectedTime ? ` · ${selectedTime}` : ""}
        </span>
        <div className="bg-primary h-1.5 w-6 shrink-0 rounded-full" />
      </>
    ) : null;

  if (!canWrite) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-muted-foreground text-sm">No tenés permiso para cargar turnos.</p>
      </div>
    );
  }

  return (
    <PanelFormShell
      onBack={handleBack}
      closeHref={closeHref}
      title={stepMeta.title}
      subtitle={stepMeta.subtitle}
      summary={summary}
      continueLabel={continueLabel}
      onContinue={handleContinue}
      continueDisabled={continueDisabled}
      continueLoading={confirmPending && step === 6}
    >
      {step === 1 ? (
        <ul className="grid gap-3">
          {professionals.map((item) => (
            <li key={item.id}>
              <SelectCard
                selected={item.id === professionalId}
                onClick={() => onSelectProfessional(item.id)}
                title={item.displayName}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {step === 2 ? (
        offeredServices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este profesional no tiene servicios asignados. Cargalos en Equipo.
          </p>
        ) : (
          <ul className="grid gap-3">
            {offeredServices.map((item) => (
              <li key={item.id}>
                <SelectCard
                  selected={serviceIds.includes(item.id)}
                  onClick={() => onToggleService(item.id)}
                  title={item.name}
                  subtitle={formatDurationLabel(item.durationMinutes)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {step === 3 ? (
        <AgendaMonthCalendar
          monthLabel={monthLabel}
          selectedDate={selectedDate}
          grid={grid}
          appointmentDates={[]}
          blockDates={[]}
          minSelectableDate={today}
          onSelectDate={onSelectDate}
          onPrevMonth={() => setYearMonth(shiftYearMonth(yearMonth, -1))}
          onNextMonth={() => setYearMonth(shiftYearMonth(yearMonth, 1))}
        />
      ) : null}

      {step === 4 ? (
        <div className="grid gap-3">
          {slotsPending || slots === null ? (
            <p className="text-muted-foreground text-sm">Cargando horarios…</p>
          ) : null}
          {slotsError ? <p className="text-destructive text-sm">{slotsError}</p> : null}
          {!slotsPending && slots && slots.length === 0 && !slotsError ? (
            <div className="grid gap-2">
              <p className="text-muted-foreground text-sm">{emptySlotsMessage(emptyReason)}</p>
              {emptyReason === "TODAY_ENDED" || emptyReason === "PAST_DATE" ? (
                <button
                  type="button"
                  className="text-primary text-left text-sm font-medium underline-offset-4 hover:underline"
                  onClick={() => {
                    onSelectDate(emptyReason === "PAST_DATE" ? today : addLocalDays(today, 1));
                    setStep(3);
                  }}
                >
                  {emptyReason === "PAST_DATE" ? "Elegir hoy" : "Elegir mañana"}
                </button>
              ) : null}
            </div>
          ) : null}
          {slots && slots.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const selected = slot === selectedTime;
                return (
                  <li key={slot}>
                    <button
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border text-[16px] font-semibold transition",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      {slot}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nuevo-phone" className="text-base font-semibold">
              WhatsApp / teléfono
            </Label>
            <Input
              id="nuevo-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+54 9 11 2345-6789"
              className="h-12 rounded-xl text-base"
            />
            {phone.trim().length > 0 && !phoneOk ? (
              <p className="text-muted-foreground text-sm">
                Ingresá un número válido (al menos 8 dígitos).
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nuevo-name" className="text-base font-semibold">
              Nombre (opcional)
            </Label>
            <Input
              id="nuevo-name"
              name="firstName"
              maxLength={100}
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Como figura en el turno"
              className="h-12 rounded-xl text-base"
            />
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="professionalId" value={professionalId} />
          <input type="hidden" name="serviceId" value={primaryServiceId} />
          <input type="hidden" name="time" value={selectedTime} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="firstName" value={firstName} />

          <div className="bg-muted/60 grid gap-3 rounded-2xl px-4 py-4 text-sm">
            <SummaryRow label="Profesional" value={professional?.displayName ?? "—"} />
            <SummaryRow
              label={selectedServices.length > 1 ? "Servicios" : "Servicio"}
              value={selectedServiceNames || "—"}
            />
            <SummaryRow
              label="Fecha"
              value={formatDisplayDate(selectedDate)}
              className="capitalize"
            />
            <SummaryRow label="Horario" value={selectedTime || "—"} />
            {selectedServices.length > 0 ? (
              <SummaryRow label="Duración" value={formatDurationLabel(totalDurationMinutes)} />
            ) : null}
            <SummaryRow
              label="Contacto"
              value={
                [firstName.trim() || null, phone.trim() || null].filter(Boolean).join(" · ") || "—"
              }
            />
          </div>
          {selectedServices.length > 1 ? (
            <p className="text-muted-foreground text-sm">
              La agenda ocupará el tiempo de {selectedServices[0]?.name} hasta que se pueda guardar
              más de un servicio.
            </p>
          ) : null}

          {confirmState?.message && !confirmState.ok ? (
            <p className="text-destructive text-sm">{confirmState.message}</p>
          ) : null}
        </form>
      ) : null}
    </PanelFormShell>
  );
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right font-medium", className)}>{value}</span>
    </div>
  );
}
