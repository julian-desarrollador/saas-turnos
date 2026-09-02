"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slotChipClassName } from "@/modules/booking/components/slot-chip";

const selectClass =
  "border-input h-10 min-h-10 w-full rounded-lg border bg-transparent px-2.5 text-sm";

export function RescheduleFilters({
  slug,
  appointmentId,
  date,
  professionalId,
  professionals,
  slots,
  selectedTime,
  error,
}: {
  slug: string;
  appointmentId: string;
  date: string;
  professionalId: string;
  professionals: { id: string; displayName: string }[];
  slots: string[];
  selectedTime: string;
  error?: string;
}) {
  return (
    <form
      method="get"
      action={`/${slug}/agenda/${appointmentId}/reprogramar`}
      className="grid gap-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="reschedule-date">Nuevo día</Label>
          <Input
            id="reschedule-date"
            name="date"
            type="date"
            required
            defaultValue={date}
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reschedule-professional">Profesional</Label>
          <select
            id="reschedule-professional"
            name="professional"
            required
            defaultValue={professionalId}
            className={selectClass}
          >
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.displayName}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-10 w-full xl:w-auto">
          Ver horarios
        </Button>
      </div>
      <div className="grid gap-2">
        <h2 className="text-sm font-medium">Horarios libres</h2>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {!error && slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay horarios disponibles para esta combinación.
          </p>
        ) : null}
        {slots.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const selected = slot === selectedTime;
              return (
                <li key={slot}>
                  <button
                    type="submit"
                    name="time"
                    value={slot}
                    className={slotChipClassName(selected)}
                  >
                    {slot}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </form>
  );
}
