"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { SelectCard } from "@/components/shared/select-card";
import { cn } from "@/lib/utils";
import {
  fetchRescheduleProfessionalsAction,
  fetchRescheduleSlotsAction,
  rescheduleAppointmentAction,
  type ActionState,
} from "@/modules/booking/adapters/inbound/actions";
import { emptySlotsMessage } from "@/modules/booking/adapters/inbound/messages";
import type { EmptySlotsReason } from "@/modules/booking/application/offered-from-snapshot";
import type { AppointmentDetail } from "@/modules/booking/application/ports/availability-repository";
import { AgendaMonthCalendar } from "@/modules/booking/components/agenda-month-calendar";
import {
  formatRescheduleDate,
  formatRescheduleTimeRange,
  rescheduleClientName,
} from "@/modules/booking/components/reschedule-view";
import {
  buildMonthGrid,
  monthDateRange,
  monthTitle,
  shiftYearMonth,
  yearMonthFromDate,
} from "@/modules/booking/domain/month-grid";
import { formatDurationLabel, minutesToTime, timeToMinutes } from "@/modules/booking/domain/time";

type RescheduleStep = 1 | 2 | 3 | 4;
type RescheduleAppointment = AppointmentDetail & { endTime: string };

export function AgendaRescheduleWizard({
  slug,
  today,
  appointment,
  professionals,
}: {
  slug: string;
  today: string;
  appointment: RescheduleAppointment;
  professionals: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<RescheduleStep>(1);
  const [selectedDate, setSelectedDate] = useState("");
  const calendarStart = appointment.localDate >= today ? appointment.localDate : today;
  const [yearMonth, setYearMonth] = useState(yearMonthFromDate(calendarStart));
  const initialProfessionalId = professionals.some(
    (professional) => professional.id === appointment.professionalId,
  )
    ? appointment.professionalId
    : (professionals[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(initialProfessionalId);
  const [availableProfessionals, setAvailableProfessionals] = useState<
    { id: string; displayName: string }[] | null
  >(null);
  const [professionalsError, setProfessionalsError] = useState<string>();
  const [professionalsPending, startProfessionalsTransition] = useTransition();
  const [teamEmptyReason, setTeamEmptyReason] = useState<EmptySlotsReason | null>(null);
  const [teamBranchName, setTeamBranchName] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [emptyReason, setEmptyReason] = useState<EmptySlotsReason | null>(null);
  const [slotsError, setSlotsError] = useState<string>();
  const [slotsPending, startSlotsTransition] = useTransition();
  const [confirmState, formAction, confirmPending] = useActionState(
    rescheduleAppointmentAction,
    undefined as ActionState | undefined,
  );

  const closeHref = `/${slug}/agenda?date=${encodeURIComponent(appointment.localDate)}` as Route;
  const professional =
    availableProfessionals?.find((item) => item.id === professionalId) ??
    professionals.find((item) => item.id === professionalId) ??
    availableProfessionals?.[0] ??
    professionals[0] ??
    null;
  const currentProfessionalAvailable = Boolean(
    availableProfessionals?.some((item) => item.id === appointment.professionalId),
  );
  const clientName = rescheduleClientName(appointment);
  const duration = formatDurationLabel(appointment.durationMinutes);
  const { year, month } = monthDateRange(yearMonth);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = monthTitle(year, month);
  const newEndTime = selectedTime
    ? minutesToTime(timeToMinutes(selectedTime) + appointment.durationMinutes)
    : "";

  useEffect(() => {
    if (step !== 2 || !selectedDate) {
      return;
    }

    startProfessionalsTransition(async () => {
      setAvailableProfessionals(null);
      setProfessionalsError(undefined);
      setTeamEmptyReason(null);
      setTeamBranchName(null);
      try {
        const payload = await fetchRescheduleProfessionalsAction(
          slug,
          appointment.id,
          selectedDate,
        );
        const list = payload.professionals;
        setAvailableProfessionals(list);
        setProfessionalsError(payload.error);
        setTeamEmptyReason(payload.emptyReason);
        setTeamBranchName(payload.branchName);
        setProfessionalId((current) => {
          if (current && list.some((item) => item.id === current)) {
            return current;
          }
          if (list.some((item) => item.id === appointment.professionalId)) {
            return appointment.professionalId;
          }
          return list[0]?.id ?? "";
        });
      } catch {
        setAvailableProfessionals([]);
        setProfessionalsError("No pudimos cargar quién puede atender este día. Intentá de nuevo.");
      }
    });
  }, [appointment.id, appointment.professionalId, selectedDate, slug, step]);

  useEffect(() => {
    if (step !== 3 || !selectedDate || !professionalId) {
      return;
    }

    startSlotsTransition(async () => {
      setSlots(null);
      setEmptyReason(null);
      setSlotsError(undefined);
      try {
        const payload = await fetchRescheduleSlotsAction(
          slug,
          appointment.id,
          professionalId,
          selectedDate,
        );
        setSlots(payload.slots);
        setEmptyReason(payload.emptyReason);
        setSlotsError(payload.error);
        setSelectedTime((current) => (current && payload.slots.includes(current) ? current : ""));
      } catch {
        setSlots([]);
        setSlotsError("No pudimos cargar los horarios. Intentá de nuevo.");
      }
    });
  }, [appointment.id, professionalId, selectedDate, slug, step]);

  const noAvailableSlots = Boolean(
    step === 3 && !slotsPending && slots && slots.length === 0 && !slotsError,
  );
  const noAvailableProfessionals = Boolean(
    step === 2 &&
    !professionalsPending &&
    availableProfessionals &&
    availableProfessionals.length === 0 &&
    !professionalsError,
  );

  function onSelectDate(dateKey: string) {
    if (dateKey < today) {
      return;
    }
    setSelectedDate(dateKey);
    setSelectedTime("");
    setSlots(null);
    setEmptyReason(null);
    setSlotsError(undefined);
    setAvailableProfessionals(null);
    setProfessionalsError(undefined);
    setTeamEmptyReason(null);
    setTeamBranchName(null);
    const targetMonth = yearMonthFromDate(dateKey);
    if (targetMonth !== yearMonth) {
      setYearMonth(targetMonth);
    }
  }

  function onSelectProfessional(id: string) {
    if (id !== professionalId) {
      setProfessionalId(id);
      setSelectedTime("");
      setSlots(null);
      setEmptyReason(null);
      setSlotsError(undefined);
    }
  }

  function handleBack() {
    if (step === 1) {
      router.push(closeHref);
      return;
    }
    setStep((current) => (current - 1) as RescheduleStep);
  }

  function handleContinue() {
    if ((step === 2 && noAvailableProfessionals) || (step === 3 && noAvailableSlots)) {
      setStep(1);
      return;
    }
    if (step < 4) {
      setStep((current) => (current + 1) as RescheduleStep);
      return;
    }
    formRef.current?.requestSubmit();
  }

  const stepMeta =
    step === 1
      ? {
          title: "Elegí el nuevo día",
          subtitle: "Paso 1 de 4 · Primero revisá el turno actual",
        }
      : step === 2
        ? {
            title: "¿Quién lo va a atender?",
            subtitle:
              professionalsPending || availableProfessionals === null
                ? "Paso 2 de 4 · Buscando quién puede atender este día"
                : noAvailableProfessionals
                  ? "Paso 2 de 4 · Nadie puede atender este día"
                  : currentProfessionalAvailable
                    ? `Paso 2 de 4 · Podés mantener a ${appointment.professionalName} o elegir otra persona`
                    : "Paso 2 de 4 · Solo aparecen quienes tienen un hueco este día",
          }
        : step === 3
          ? {
              title: "Elegí la nueva hora",
              subtitle: "Paso 3 de 4 · Elegí una hora de inicio disponible",
            }
          : {
              title: "Confirmá el cambio",
              subtitle: "Paso 4 de 4 · Revisá todo antes de guardar",
            };

  const summary =
    step === 2 ? (
      <SelectionSummary label="Nuevo día" value={formatRescheduleDate(selectedDate)} />
    ) : step === 3 ? (
      <div className="grid w-full gap-1.5">
        <SelectionSummary label="Nuevo día" value={formatRescheduleDate(selectedDate)} />
        <SelectionSummary label="Profesional" value={professional?.displayName ?? "—"} />
      </div>
    ) : null;

  const continueDisabled =
    (step === 1 && !selectedDate) ||
    (step === 2 &&
      (professionalsPending ||
        availableProfessionals === null ||
        Boolean(professionalsError) ||
        (!noAvailableProfessionals && !professionalId))) ||
    (step === 3 && !noAvailableSlots && (!selectedTime || slotsPending)) ||
    (step === 4 && confirmPending);

  const continueLabel =
    (step === 2 && noAvailableProfessionals) || (step === 3 && noAvailableSlots)
      ? "Cambiar fecha"
      : step === 4
        ? confirmPending
          ? "Guardando cambio…"
          : "Confirmar cambio"
        : "Continuar";

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
      continueLoading={confirmPending}
    >
      {step === 1 ? (
        <div className="grid gap-6">
          <SummaryCard
            title="Turno actual"
            description="Este turno no cambia hasta que confirmes uno nuevo."
          >
            <DetailRow label="Cliente" value={clientName} />
            <DetailRow label="Teléfono" value={appointment.clientPhone} breakValue />
            <DetailRow label="Servicio" value={appointment.serviceName} />
            <DetailRow label="Profesional" value={appointment.professionalName} />
            <DetailRow
              label="Fecha"
              value={formatRescheduleDate(appointment.localDate)}
              capitalize
            />
            <DetailRow
              label="Horario"
              value={formatRescheduleTimeRange(appointment.localTime, appointment.endTime)}
            />
            <DetailRow label="Duración" value={duration} />
          </SummaryCard>

          <section className="grid gap-3" aria-labelledby="new-date-title">
            <div>
              <h2 id="new-date-title" className="text-lg font-bold">
                Nuevo día
              </h2>
              <p className="text-muted-foreground text-sm">
                Tocá el día al que querés mover el turno.
              </p>
            </div>
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
          </section>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4" aria-live="polite">
          {professionalsPending || availableProfessionals === null ? (
            <p className="text-muted-foreground text-base">
              Buscando quién puede atender este día…
            </p>
          ) : null}
          {professionalsError ? (
            <p className="text-destructive text-base">{professionalsError}</p>
          ) : null}
          {noAvailableProfessionals ? (
            <div className="bg-muted/60 grid gap-3 rounded-2xl p-4">
              <p className="text-base font-medium">Este día no hay quién pueda atender.</p>
              <p className="text-base">
                {teamEmptyReason === "BRANCH_BLOCKED" && teamBranchName
                  ? `Hay un bloqueo de ${teamBranchName} este día.`
                  : "Puede ser un bloqueo del local, que nadie trabaje o que no queden huecos. Cambiá la fecha para seguir."}
              </p>
              <button
                type="button"
                className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                onClick={() => setStep(1)}
              >
                Elegir otro día
              </button>
            </div>
          ) : null}
          {availableProfessionals && availableProfessionals.length > 0 ? (
            <ul className="grid gap-3">
              {availableProfessionals.map((item) => (
                <li key={item.id}>
                  <SelectCard
                    selected={item.id === professionalId}
                    onClick={() => onSelectProfessional(item.id)}
                    title={item.displayName}
                    subtitle={
                      item.id === appointment.professionalId
                        ? "Profesional del turno actual"
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4" aria-live="polite">
          {slotsPending || slots === null ? (
            <p className="text-muted-foreground text-base">Buscando horarios disponibles…</p>
          ) : null}
          {slotsError ? <p className="text-destructive text-base">{slotsError}</p> : null}
          {!slotsPending && slots && slots.length === 0 && !slotsError ? (
            <div className="bg-muted/60 grid gap-3 rounded-2xl p-4">
              <p className="text-base font-medium">{emptySlotsMessage(emptyReason)}</p>
              <p className="text-base">Podés probar con otro día o con otro profesional.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                  onClick={() => setStep(1)}
                >
                  Elegir otro día
                </button>
                {(availableProfessionals?.length ?? professionals.length) > 1 ? (
                  <button
                    type="button"
                    className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                    onClick={() => setStep(2)}
                  >
                    Elegir otra persona
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {slots && slots.length > 0 ? (
            <section className="grid gap-3" aria-labelledby="available-times-title">
              <div>
                <h2 id="available-times-title" className="text-lg font-bold">
                  Horas disponibles
                </h2>
                <p className="text-muted-foreground text-sm">
                  Tocá la hora en que debe comenzar el turno.
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const selected = slot === selectedTime;
                  return (
                    <li key={slot}>
                      <button
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border text-base font-semibold transition",
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
            </section>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="professionalId" value={professionalId} />
          <input type="hidden" name="time" value={selectedTime} />

          <SummaryCard title="Datos que no cambian">
            <DetailRow label="Cliente" value={clientName} />
            <DetailRow label="Teléfono" value={appointment.clientPhone} breakValue />
            <DetailRow label="Servicio" value={appointment.serviceName} />
          </SummaryCard>

          <SummaryCard title="Turno actual">
            <DetailRow label="Profesional" value={appointment.professionalName} />
            <DetailRow
              label="Fecha"
              value={formatRescheduleDate(appointment.localDate)}
              capitalize
            />
            <DetailRow
              label="Horario"
              value={formatRescheduleTimeRange(appointment.localTime, appointment.endTime)}
            />
          </SummaryCard>

          <SummaryCard title="Nuevo turno" emphasis>
            <DetailRow label="Profesional" value={professional?.displayName ?? "—"} />
            <DetailRow label="Fecha" value={formatRescheduleDate(selectedDate)} capitalize />
            <DetailRow
              label="Horario"
              value={formatRescheduleTimeRange(selectedTime, newEndTime)}
            />
            <DetailRow label="Duración" value={duration} />
          </SummaryCard>

          <p className="text-muted-foreground text-sm">
            El turno actual no cambia hasta que confirmes.
          </p>
          {confirmState?.message && !confirmState.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {confirmState.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </PanelFormShell>
  );
}

function SelectionSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-semibold uppercase">{label}</p>
      <p className="truncate text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  description,
  emphasis = false,
  children,
}: {
  title: string;
  description?: string;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "grid gap-3 rounded-2xl border p-4 shadow-sm",
        emphasis ? "border-primary bg-primary/5 ring-primary/15 ring-2" : "bg-card",
      )}
    >
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-muted-foreground mt-0.5 text-sm">{description}</p> : null}
      </div>
      <div className="grid gap-2.5 text-sm">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  capitalize = false,
  breakValue = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  breakValue?: boolean;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span
        className={cn(
          "text-right font-semibold",
          capitalize && "capitalize",
          breakValue && "break-all",
        )}
      >
        {value}
      </span>
    </div>
  );
}
