"use client";

import { CalendarDays, Check } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { TimeInput } from "@/components/shared/time-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AgendaMonthCalendar } from "@/modules/booking/components/agenda-month-calendar";
import {
  buildMonthGrid,
  monthDateRange,
  monthTitle,
  shiftYearMonth,
  yearMonthFromDate,
} from "@/modules/booking/domain/month-grid";
import {
  createCalendarBlockAction,
  type ActionState,
} from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  BranchRecord,
  ProfessionalRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import type { CalendarBlockRecord } from "@/modules/tenant-config/application/ports/schedule-repository";
import { CalendarBlockList } from "@/modules/tenant-config/components/calendar-block-list";

type WizardStep = 1 | 2 | 3 | 4;
type DateField = "single" | "range";

function currentYearMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function formatDisplayDate(localDate: string): string {
  if (!localDate) {
    return "";
  }
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  const instant = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(instant)
    .replace(".", "");
  return `${weekday} ${localDate.slice(8, 10)}/${localDate.slice(5, 7)}`;
}

function BlockDateField({
  id,
  label,
  value,
  placeholder = "Elegí una fecha",
  open,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="px-3 text-base font-semibold">
        {label}
      </Label>
      <button
        id={id}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "border-input bg-background flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 text-left text-base",
          open && "border-ring ring-ring/50 ring-3",
        )}
      >
        <span className={cn("min-w-0 truncate capitalize", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <CalendarDays className="text-muted-foreground size-5 shrink-0" strokeWidth={2} />
      </button>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer rounded-2xl border px-4 py-4 text-left shadow-sm transition",
        selected
          ? "border-primary bg-primary/5 ring-primary/25 ring-2 ring-inset"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{title}</p>
          {subtitle ? <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p> : null}
        </div>
        {selected ? (
          <span className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
            <Check className="size-3" strokeWidth={2.5} />
            Seleccionado
          </span>
        ) : null}
      </div>
    </button>
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

export function AgendaBloquearWizard({
  slug,
  tenantName,
  canWrite,
  branches,
  professionals,
  blocks,
}: {
  slug: string;
  tenantName: string;
  canWrite: boolean;
  branches: BranchRecord[];
  professionals: ProfessionalRecord[];
  blocks: CalendarBlockRecord[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [branchOwner, setBranchOwner] = useState("");
  const [professionalOwners, setProfessionalOwners] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isRange, setIsRange] = useState(false);
  const [openField, setOpenField] = useState<DateField | null>(null);
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const calendarDialogRef = useRef<HTMLDialogElement>(null);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmState, setConfirmState] = useState<ActionState | undefined>();

  const closeHref = `/${slug}/agenda` as Route;

  const selectedOwners = useMemo(() => {
    if (branchOwner) {
      return [branchOwner];
    }
    return professionalOwners;
  }, [branchOwner, professionalOwners]);

  const hasOwner = selectedOwners.length > 0;

  const ownerLabel = useMemo(() => {
    if (branchOwner) {
      const id = branchOwner.slice("branch:".length);
      return branches.find((branch) => branch.id === id)?.name ?? "Sucursal";
    }
    if (professionalOwners.length === 0) {
      return "";
    }
    const names = professionalOwners.map((owner) => {
      const id = owner.slice("professional:".length);
      return (
        professionals.find((professional) => professional.id === id)?.displayName ?? "Profesional"
      );
    });
    return names.join(", ");
  }, [branchOwner, professionalOwners, branches, professionals]);

  const datesOk = isRange
    ? Boolean(startDate && endDate && startDate <= endDate)
    : Boolean(startDate);
  const timesOk = allDay || Boolean(startTime && endTime && startTime < endTime);
  const { year, month } = monthDateRange(yearMonth);
  const dateGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const dateMonthLabel = monthTitle(year, month);
  const rangeFieldLabel = startDate
    ? endDate
      ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
      : `${formatDisplayDate(startDate)} – …`
    : "";

  useEffect(() => {
    const dialog = calendarDialogRef.current;
    if (!dialog) {
      return;
    }
    if (openField) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [openField]);

  function toggleDateField(field: DateField) {
    if (openField === field) {
      setOpenField(null);
      return;
    }
    setYearMonth(startDate ? yearMonthFromDate(startDate) : currentYearMonth());
    setOpenField(field);
  }

  function selectCalendarDate(dateKey: string) {
    if (openField !== "range") {
      setStartDate(dateKey);
      setEndDate(dateKey);
      setOpenField(null);
      return;
    }
    if (!startDate || endDate) {
      setStartDate(dateKey);
      setEndDate("");
      return;
    }
    if (dateKey < startDate) {
      setStartDate(dateKey);
      setEndDate("");
      return;
    }
    setEndDate(dateKey);
    setOpenField(null);
  }

  function selectBranch(value: string) {
    setBranchOwner(value);
    setProfessionalOwners([]);
  }

  function toggleProfessional(value: string) {
    setBranchOwner("");
    setProfessionalOwners((current) =>
      current.includes(value) ? current.filter((owner) => owner !== value) : [...current, value],
    );
  }

  function handleBack() {
    if (step <= 1) {
      router.push(closeHref);
      return;
    }
    setOpenField(null);
    if (step === 4) {
      setConfirmState(undefined);
    }
    setStep((prev) => (prev - 1) as WizardStep);
  }

  function goToDatesAfterOverlap() {
    setConfirmState(undefined);
    setOpenField(null);
    setStep(2);
  }

  async function submitBlocks() {
    if (!hasOwner || !datesOk || !timesOk || !canWrite || confirmPending) {
      return;
    }

    setConfirmPending(true);
    setConfirmState(undefined);

    for (const owner of selectedOwners) {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("owner", owner);
      formData.set("startDate", startDate);
      formData.set("endDate", isRange ? endDate : startDate);
      formData.set("startTime", allDay ? "" : startTime);
      formData.set("endTime", allDay ? "" : endTime);
      formData.set("reason", reason);

      const result = await createCalendarBlockAction(undefined, formData);
      if (!result.ok) {
        setConfirmState(result);
        setConfirmPending(false);
        return;
      }
    }

    setConfirmState({ ok: true });
    setConfirmPending(false);
    const params = new URLSearchParams();
    params.set("date", startDate);
    params.set("month", yearMonthFromDate(startDate));
    params.set("blocked", "1");
    params.set("blockFrom", startDate);
    const rangeEnd = isRange ? endDate : startDate;
    if (rangeEnd && rangeEnd !== startDate) {
      params.set("blockTo", rangeEnd);
    }
    if (!allDay && startTime && endTime) {
      params.set("blockStart", startTime);
      params.set("blockEnd", endTime);
    }
    if (ownerLabel) {
      params.set("blockWho", ownerLabel);
    }
    router.push(`/${slug}/agenda?${params.toString()}` as Route);
  }

  function handleContinue() {
    if (step === 1 && hasOwner) {
      setStep(2);
      return;
    }
    if (step === 2 && datesOk) {
      setOpenField(null);
      setStep(3);
      return;
    }
    if (step === 3 && timesOk) {
      setConfirmState(undefined);
      setStep(4);
      return;
    }
    if (step === 4 && confirmState && !confirmState.ok) {
      goToDatesAfterOverlap();
      return;
    }
    if (step === 4) {
      void submitBlocks();
    }
  }

  const stepMeta = (() => {
    if (step === 1) {
      return {
        title: "Bloquear horario",
        subtitle: `Elegí la sede o uno o más profesionales en ${tenantName}`,
      };
    }
    if (step === 2) {
      return { title: "Elegí las fechas", subtitle: ownerLabel || "Un día o un rango" };
    }
    if (step === 3) {
      return { title: "Horario del bloqueo", subtitle: "Todo el día o una franja" };
    }
    return { title: "Confirmar bloqueo", subtitle: "Revisá el resumen antes de guardar" };
  })();

  const confirmFailed = Boolean(confirmState && !confirmState.ok);
  const continueDisabled =
    (step === 1 && !hasOwner) ||
    (step === 2 && !datesOk) ||
    (step === 3 && !timesOk) ||
    (step === 4 &&
      !confirmFailed &&
      (!canWrite || confirmPending || !hasOwner || !datesOk || !timesOk));

  const continueLabel =
    step === 4 && confirmFailed
      ? "Cambiar fechas"
      : step === 4
        ? confirmPending
          ? "Guardando…"
          : "Confirmar bloqueo"
        : "Continuar";

  const scheduleLabel = allDay
    ? "Todo el día"
    : startTime && endTime
      ? `${startTime} – ${endTime}`
      : "—";

  const summary =
    step === 1 ? (
      <span className="text-foreground min-w-0 flex-1 truncate text-lg font-semibold">
        {ownerLabel || "Sin agenda"}
      </span>
    ) : step === 2 ? (
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm font-medium capitalize">
        {datesOk
          ? !isRange || startDate === endDate
            ? formatDisplayDate(startDate)
            : `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
          : "Seleccioná las fechas"}
      </span>
    ) : step === 3 ? (
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm font-medium">
        {scheduleLabel}
      </span>
    ) : null;

  if (!canWrite) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-8">
        <p className="text-muted-foreground text-sm">No tenés permiso para cargar bloqueos.</p>
        <section className="grid gap-3">
          <h2 className="text-lg font-bold">Bloqueos</h2>
          <CalendarBlockList
            slug={slug}
            blocks={blocks}
            branches={branches}
            professionals={professionals}
            canWrite={false}
          />
        </section>
      </div>
    );
  }

  const activeProfessionals = professionals.filter((professional) => professional.isActive);

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
      continueLoading={confirmPending && step === 4 && !confirmFailed}
    >
      {step === 1 ? (
        <>
          {branches.length === 0 && activeProfessionals.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay sucursales ni profesionales para bloquear. Cargalos en Equipo.
            </p>
          ) : (
            <ul className="grid gap-3">
              {branches.map((branch) => {
                const value = `branch:${branch.id}`;
                return (
                  <li key={branch.id}>
                    <SelectCard
                      selected={branchOwner === value}
                      onClick={() => selectBranch(value)}
                      title={branch.name}
                      subtitle="Sucursal · bloquea toda la sede"
                    />
                  </li>
                );
              })}
              {activeProfessionals.map((professional) => {
                const value = `professional:${professional.id}`;
                return (
                  <li key={professional.id}>
                    <SelectCard
                      selected={professionalOwners.includes(value)}
                      onClick={() => toggleProfessional(value)}
                      title={professional.displayName}
                      subtitle="Equipo · podés elegir varios"
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <section className="border-border mt-8 space-y-3 border-t pt-6">
            <h2 className="text-lg font-bold tracking-tight">Bloqueos cargados</h2>
            <CalendarBlockList
              slug={slug}
              blocks={blocks}
              branches={branches}
              professionals={professionals}
              canWrite={canWrite}
            />
          </section>
        </>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <ul className="grid gap-3">
            <li>
              <SelectCard
                selected={!isRange}
                onClick={() => {
                  setIsRange(false);
                  setOpenField(null);
                  if (startDate) {
                    setEndDate(startDate);
                  }
                }}
                title="Un día"
                subtitle="Bloquea una sola fecha"
              />
            </li>
            <li>
              <SelectCard
                selected={isRange}
                onClick={() => {
                  setIsRange(true);
                  setOpenField(null);
                  if (startDate) {
                    setEndDate("");
                  }
                }}
                title="Varios días"
                subtitle="Desde una fecha hasta otra"
              />
            </li>
          </ul>
          {isRange ? (
            <BlockDateField
              id="block-range-date"
              label="Fechas"
              value={rangeFieldLabel}
              placeholder="Elegí desde y hasta"
              open={openField === "range"}
              onToggle={() => toggleDateField("range")}
            />
          ) : (
            <BlockDateField
              id="block-single-date"
              label="Día"
              value={startDate ? formatDisplayDate(startDate) : ""}
              open={openField === "single"}
              onToggle={() => toggleDateField("single")}
            />
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4">
          <ul className="grid gap-3">
            <li>
              <SelectCard
                selected={allDay}
                onClick={() => {
                  setAllDay(true);
                  setStartTime("");
                  setEndTime("");
                }}
                title="Todo el día"
                subtitle="Bloquea la jornada completa en esas fechas"
              />
            </li>
            <li>
              <SelectCard
                selected={!allDay}
                onClick={() => setAllDay(false)}
                title="Franja horaria"
                subtitle="Solo un tramo del día"
              />
            </li>
          </ul>
          {!allDay ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="block-start-time" className="text-base font-semibold">
                  Hora inicio
                </Label>
                <TimeInput
                  id="block-start-time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                  }}
                  className="border-input h-12 rounded-xl border bg-transparent px-3 text-base"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="block-end-time" className="text-base font-semibold">
                  Hora fin
                </Label>
                <TimeInput
                  id="block-end-time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                  }}
                  className="border-input h-12 rounded-xl border bg-transparent px-3 text-base"
                />
              </div>
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="block-reason" className="text-base font-semibold">
              Motivo (opcional)
            </Label>
            <Input
              id="block-reason"
              value={reason}
              maxLength={255}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Vacaciones, feriado…"
              className="h-12 rounded-xl text-base"
            />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-4">
          <div className="bg-muted/60 grid gap-3 rounded-2xl px-4 py-4 text-sm">
            <SummaryRow label="Agenda" value={ownerLabel || "—"} />
            <SummaryRow label="Desde" value={formatDisplayDate(startDate)} className="capitalize" />
            <SummaryRow label="Hasta" value={formatDisplayDate(endDate)} className="capitalize" />
            <SummaryRow label="Horario" value={scheduleLabel} />
            <SummaryRow label="Motivo" value={reason.trim() || "—"} />
            {selectedOwners.length > 1 ? (
              <SummaryRow
                label="Bloqueos"
                value={`${selectedOwners.length} agendas (uno por profesional)`}
              />
            ) : null}
          </div>

          {confirmState?.message && !confirmState.ok ? (
            <div className="grid gap-2" role="alert">
              <p className="text-destructive text-base font-medium">{confirmState.message}</p>
              <p className="text-base">Elegí otra fecha o un horario que no se pise.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <dialog
        ref={calendarDialogRef}
        className="bg-background text-foreground fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-0 shadow-xl backdrop:bg-black/40"
        onClose={() => setOpenField(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setOpenField(null);
          }
        }}
      >
        {openField ? (
          <div>
            {openField === "range" ? (
              <p className="text-muted-foreground px-4 pt-4 text-center text-sm">
                Elegí el primer día, después el último.
              </p>
            ) : null}
            <AgendaMonthCalendar
              monthLabel={dateMonthLabel}
              selectedDate={startDate}
              rangeEndDate={endDate || undefined}
              grid={dateGrid}
              appointmentDates={[]}
              blockDates={[]}
              onSelectDate={selectCalendarDate}
              onPrevMonth={() => setYearMonth(shiftYearMonth(yearMonth, -1))}
              onNextMonth={() => setYearMonth(shiftYearMonth(yearMonth, 1))}
            />
          </div>
        ) : null}
      </dialog>
    </PanelFormShell>
  );
}
