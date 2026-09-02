"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setWeeklyScheduleAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type { WeeklySlotRecord } from "@/modules/tenant-config/application/ports/schedule-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

const WEEKDAYS = [
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
  { day: 0, label: "Domingo" },
] as const;

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

function formatSlot(slot: WeeklySlotRecord): string {
  return `${slot.startTime}–${slot.endTime} · ${slot.capacity}`;
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

export function WeeklyScheduleForm({
  slug,
  ownerKind,
  ownerId,
  slots,
  canWrite,
}: {
  slug: string;
  ownerKind: "branch" | "professional";
  ownerId: string;
  slots: WeeklySlotRecord[];
  canWrite: boolean;
}) {
  const [state, formAction, pending] = useActionState(setWeeklyScheduleAction, undefined);
  const [openDays, setOpenDays] = useState(() => {
    const open: Record<number, boolean> = {};
    for (const weekday of WEEKDAYS) {
      open[weekday.day] = slotsForDay(slots, weekday.day).length > 0;
    }
    return open;
  });
  const [draftsByDay, setDraftsByDay] = useState(() => draftsFromSlots(slots));
  const capacityHeader = ownerKind === "branch" ? "Techo" : "A la vez";

  if (!canWrite) {
    return (
      <WeekTable>
        {WEEKDAYS.map((weekday) => {
          const daySlots = slotsForDay(slots, weekday.day);
          return (
            <tr key={weekday.day} className="border-border border-t">
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                {weekday.label}
              </th>
              <td className="py-2 pr-3">
                {daySlots.length === 0 ? (
                  <span className="text-muted-foreground">Cerrado</span>
                ) : (
                  daySlots.map(formatSlot).join(" · ")
                )}
              </td>
            </tr>
          );
        })}
      </WeekTable>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="ownerKind" value={ownerKind} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs">
              <th className="pb-2 font-medium">Día</th>
              <th className="pb-2 font-medium">Abierto</th>
              <th className="pb-2 font-medium">Desde</th>
              <th className="pb-2 font-medium">Hasta</th>
              <th className="pb-2 font-medium">{capacityHeader}</th>
              <th className="pb-2 font-medium">
                <span className="sr-only">Franjas</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((weekday) => {
              const isOpen = openDays[weekday.day] === true;
              const drafts = draftsByDay[weekday.day] ?? [];

              return (
                <DayRows
                  key={weekday.day}
                  ownerId={ownerId}
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
          </tbody>
        </table>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando…" : "Guardar horario"}
      </Button>
    </form>
  );
}

function WeekTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr className="text-muted-foreground text-left text-xs">
            <th className="pb-2 font-medium">Día</th>
            <th className="pb-2 font-medium">Horario</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function DayRows({
  ownerId,
  weekday,
  isOpen,
  drafts,
  onOpenChange,
  onAdd,
  onRemove,
}: {
  ownerId: string;
  weekday: (typeof WEEKDAYS)[number];
  isOpen: boolean;
  drafts: SlotDraft[];
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onRemove: (draftId: string) => void;
}) {
  const openId = `open-${ownerId}-${weekday.day}`;
  const canAdd = drafts.length < MAX_FRANJAS_POR_DIA;

  if (!isOpen) {
    return (
      <tr className="border-border border-t align-middle">
        <th scope="row" className="py-2 pr-3 text-left font-medium">
          {weekday.label}
        </th>
        <td className="py-2 pr-3">
          <OpenToggle id={openId} isOpen={false} onOpenChange={onOpenChange} />
        </td>
        <td colSpan={4} className="text-muted-foreground py-2">
          Cerrado
        </td>
      </tr>
    );
  }

  return (
    <>
      {drafts.map((draft, index) => (
        <tr
          key={draft.id}
          className={index === 0 ? "border-border border-t align-middle" : "align-middle"}
        >
          {index === 0 ? (
            <>
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                {weekday.label}
              </th>
              <td className="py-2 pr-3">
                <OpenToggle id={openId} isOpen onOpenChange={onOpenChange} />
              </td>
            </>
          ) : (
            <td colSpan={2} />
          )}
          <SlotCells ownerId={ownerId} day={weekday.day} index={index} draft={draft} />
          <td className="py-2">
            <div className="flex flex-col items-start gap-1">
              {index > 0 ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs whitespace-nowrap underline-offset-4 hover:underline"
                  onClick={() => onRemove(draft.id)}
                >
                  Quitar
                </button>
              ) : null}
              {index === drafts.length - 1 && canAdd ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs whitespace-nowrap underline-offset-4 hover:underline"
                  onClick={onAdd}
                >
                  Agregar franja
                </button>
              ) : null}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function OpenToggle({
  id,
  isOpen,
  onOpenChange,
}: {
  id: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Label htmlFor={id} className="text-muted-foreground font-normal">
      <Checkbox
        id={id}
        checked={isOpen}
        onCheckedChange={(checked) => onOpenChange(checked === true)}
      />
      <span>{isOpen ? "Sí" : "No"}</span>
    </Label>
  );
}

function SlotCells({
  ownerId,
  day,
  index,
  draft,
}: {
  ownerId: string;
  day: number;
  index: number;
  draft: SlotDraft;
}) {
  const field = `d${day}s${index}`;
  const prefix = `${ownerId}-${draft.id}`;
  return (
    <>
      <td className="py-2 pr-2">
        <Label htmlFor={`${prefix}Start`} className="sr-only">
          Desde
        </Label>
        <Input
          id={`${prefix}Start`}
          name={`${field}Start`}
          type="time"
          required
          defaultValue={draft.start}
          className="w-[7.5rem]"
        />
      </td>
      <td className="py-2 pr-2">
        <Label htmlFor={`${prefix}End`} className="sr-only">
          Hasta
        </Label>
        <Input
          id={`${prefix}End`}
          name={`${field}End`}
          type="time"
          required
          defaultValue={draft.end}
          className="w-[7.5rem]"
        />
      </td>
      <td className="py-2 pr-2">
        <Label htmlFor={`${prefix}Capacity`} className="sr-only">
          Capacidad
        </Label>
        <Input
          id={`${prefix}Capacity`}
          name={`${field}Capacity`}
          type="number"
          min={1}
          step={1}
          required
          defaultValue={draft.capacity}
          className="w-16"
        />
      </td>
    </>
  );
}
