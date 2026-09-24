"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { TimeInput } from "@/components/shared/time-input";
import { cn } from "@/lib/utils";
import { setWeeklyScheduleAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type { WeeklySlotRecord } from "@/modules/tenant-config/application/ports/schedule-repository";
import { capacityQuestion, WEEKDAYS } from "@/modules/tenant-config/components/schedule-view";

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";
/** Tope de la pantalla. El modelo admite N; si un negocio pide más, se sube acá. */
const MAX_FRANJAS_POR_DIA = 4;

type SlotDraft = {
  id: string;
  start: string;
  end: string;
  capacity: number;
};

function slotsForDay(slots: WeeklySlotRecord[], day: number): WeeklySlotRecord[] {
  return slots
    .filter((slot) => slot.dayOfWeek === day)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function newDraftId(): string {
  return crypto.randomUUID();
}

function draftsFromSlots(slots: WeeklySlotRecord[]): Record<number, SlotDraft[]> {
  const drafts: Record<number, SlotDraft[]> = {};
  for (const weekday of WEEKDAYS) {
    drafts[weekday.day] = slotsForDay(slots, weekday.day).map((slot) => ({
      id: slot.id,
      start: slot.startTime,
      end: slot.endTime,
      capacity: slot.capacity,
    }));
  }
  return drafts;
}

function nextSlotDefaults(previous: SlotDraft | undefined): Omit<SlotDraft, "id"> {
  const start = previous?.end ?? DEFAULT_START;
  const end = start < DEFAULT_END ? DEFAULT_END : "21:00";
  if (start >= end) {
    return { start: DEFAULT_START, end: DEFAULT_END, capacity: previous?.capacity ?? 1 };
  }
  return { start, end, capacity: previous?.capacity ?? 1 };
}

function defaultDraft(): SlotDraft {
  return { id: newDraftId(), start: DEFAULT_START, end: DEFAULT_END, capacity: 1 };
}

function draftsForOpenDay(current: SlotDraft[] | undefined): SlotDraft[] {
  if (current && current.length > 0) {
    return current;
  }
  return [defaultDraft()];
}

function addDraft(current: SlotDraft[]): SlotDraft[] {
  if (current.length >= MAX_FRANJAS_POR_DIA) {
    return current;
  }
  const previous = current[current.length - 1];
  return [...current, { id: newDraftId(), ...nextSlotDefaults(previous) }];
}

function removeDraft(current: SlotDraft[], draftId: string): SlotDraft[] {
  if (current.length <= 1) {
    return current;
  }
  return current.filter((draft) => draft.id !== draftId);
}

export function WeeklyScheduleScreen({
  slug,
  ownerKind,
  ownerId,
  ownerName,
  slots,
  canWrite,
}: {
  slug: string;
  ownerKind: "branch" | "professional";
  ownerId: string;
  ownerName: string;
  slots: WeeklySlotRecord[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(setWeeklyScheduleAction, undefined);
  const [openDays, setOpenDays] = useState(() => {
    const open: Record<number, boolean> = {};
    for (const weekday of WEEKDAYS) {
      open[weekday.day] = slotsForDay(slots, weekday.day).length > 0;
    }
    return open;
  });
  const [draftsByDay, setDraftsByDay] = useState(() => draftsFromSlots(slots));

  const listHref = `/${slug}/schedule` as Route;
  const subtitle =
    ownerKind === "branch"
      ? "Marcá los días que abre el local y a qué hora."
      : "Marcá los días que atiende y a qué hora.";

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title={ownerName}
      subtitle={
        canWrite ? subtitle : "Así queda la semana. Pedile a un administrador si hay que cambiarla."
      }
      continueLabel={pending ? "Guardando…" : "Guardar"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueLoading={pending}
      hideContinue={!canWrite}
    >
      {canWrite ? (
        <form ref={formRef} action={formAction} className="grid gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="ownerKind" value={ownerKind} />
          <input type="hidden" name="ownerId" value={ownerId} />
          <input type="hidden" name="ownerName" value={ownerName} />

          {WEEKDAYS.map((weekday) => {
            const isOpen = openDays[weekday.day] === true;
            const drafts = draftsByDay[weekday.day] ?? [];
            return (
              <DayCard
                key={weekday.day}
                ownerId={ownerId}
                ownerKind={ownerKind}
                weekday={weekday}
                isOpen={isOpen}
                drafts={drafts}
                onOpenChange={(next) => {
                  setOpenDays((current) => ({ ...current, [weekday.day]: next }));
                  setDraftsByDay((current) => ({
                    ...current,
                    [weekday.day]: next ? draftsForOpenDay(current[weekday.day]) : [],
                  }));
                }}
                onAdd={() => {
                  setDraftsByDay((current) => ({
                    ...current,
                    [weekday.day]: addDraft(current[weekday.day] ?? []),
                  }));
                }}
                onRemove={(draftId) => {
                  setDraftsByDay((current) => ({
                    ...current,
                    [weekday.day]: removeDraft(current[weekday.day] ?? [], draftId),
                  }));
                }}
              />
            );
          })}

          {state?.message && !state.ok ? (
            <p role="alert" className="text-destructive text-sm font-medium">
              {state.message}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="grid gap-3">
          {WEEKDAYS.map((weekday) => {
            const daySlots = slotsForDay(slots, weekday.day);
            return (
              <div key={weekday.day} className="border-border rounded-2xl border px-4 py-4">
                <p className="text-lg font-semibold">{weekday.label}</p>
                {daySlots.length === 0 ? (
                  <p className="mt-1.5 text-lg leading-snug">Cerrado</p>
                ) : (
                  <ul className="mt-1.5 grid gap-1">
                    {daySlots.map((slot) => (
                      <li key={slot.id} className="text-lg leading-snug tabular-nums">
                        {slot.startTime}–{slot.endTime}
                        <span className="text-muted-foreground"> · {slot.capacity} a la vez</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PanelFormShell>
  );
}

function DayCard({
  ownerId,
  ownerKind,
  weekday,
  isOpen,
  drafts,
  onOpenChange,
  onAdd,
  onRemove,
}: {
  ownerId: string;
  ownerKind: "branch" | "professional";
  weekday: (typeof WEEKDAYS)[number];
  isOpen: boolean;
  drafts: SlotDraft[];
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onRemove: (draftId: string) => void;
}) {
  const canAdd = drafts.length < MAX_FRANJAS_POR_DIA;

  return (
    <div className="border-border rounded-2xl border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">{weekday.label}</p>
        <button
          type="button"
          onClick={() => {
            onOpenChange(!isOpen);
          }}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition",
            isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {isOpen ? "Abierto" : "Cerrado"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-5">
          {drafts.map((draft, index) => (
            <div key={draft.id} className="grid gap-3">
              {index > 0 ? (
                <p className="text-muted-foreground text-sm font-medium">Otra franja</p>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  id={`${ownerId}-${draft.id}-start`}
                  name={`d${weekday.day}s${index}Start`}
                  label="Desde"
                  defaultValue={draft.start}
                />
                <TimeField
                  id={`${ownerId}-${draft.id}-end`}
                  name={`d${weekday.day}s${index}End`}
                  label="Hasta"
                  defaultValue={draft.end}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${ownerId}-${draft.id}-capacity`} className="text-sm font-medium">
                  {capacityQuestion(ownerKind)}
                </label>
                <input
                  id={`${ownerId}-${draft.id}-capacity`}
                  name={`d${weekday.day}s${index}Capacity`}
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={draft.capacity}
                  className="border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 w-24 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2"
                />
              </div>
              {index > 0 ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground w-fit text-sm font-medium underline-offset-4 hover:underline"
                  onClick={() => {
                    onRemove(draft.id);
                  }}
                >
                  Quitar esta franja
                </button>
              ) : null}
            </div>
          ))}
          {canAdd ? (
            <button
              type="button"
              className="text-foreground w-fit text-sm font-semibold underline-offset-4 hover:underline"
              onClick={onAdd}
            >
              Agregar otra franja
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 text-base">Ese día no se ofrecen turnos.</p>
      )}
    </div>
  );
}

function TimeField({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <TimeInput
        id={id}
        name={name}
        required
        defaultValue={defaultValue}
        className="border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-3 text-base outline-none focus-visible:ring-2"
      />
    </div>
  );
}
