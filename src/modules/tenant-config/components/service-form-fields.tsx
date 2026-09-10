"use client";

import { useState } from "react";

const FIELD_CLASS =
  "border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2";

export function ServiceFormFields({
  nameId,
  nameValue,
  onNameChange,
  durationDefault,
  priceDefault,
  prepDefault = 0,
  cleanupDefault = 0,
  earliestDefault,
  latestDefault,
  moreOptionsOpen,
}: {
  nameId: string;
  nameValue: string;
  onNameChange: (value: string) => void;
  durationDefault?: number;
  priceDefault?: number;
  prepDefault?: number;
  cleanupDefault?: number;
  earliestDefault?: string | null;
  latestDefault?: string | null;
  moreOptionsOpen: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(moreOptionsOpen);

  return (
    <>
      <div className="grid gap-2">
        <label htmlFor={nameId} className="text-base font-semibold">
          Nombre
        </label>
        <p className="text-muted-foreground text-sm">Así aparece en la agenda al dar un turno.</p>
        <input
          id={nameId}
          name="name"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="Corte"
          value={nameValue}
          onChange={(event) => {
            onNameChange(event.target.value);
          }}
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${nameId}-duration`} className="text-base font-semibold">
          Duración
        </label>
        <p className="text-muted-foreground text-sm">Cuántos minutos dura el servicio.</p>
        <input
          id={`${nameId}-duration`}
          name="durationMinutes"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={durationDefault}
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${nameId}-price`} className="text-base font-semibold">
          Precio
        </label>
        <p className="text-muted-foreground text-sm">En pesos, sin centavos.</p>
        <input
          id={`${nameId}-price`}
          name="priceAmount"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={priceDefault}
          className={FIELD_CLASS}
        />
      </div>

      <details
        className="border-border rounded-2xl border px-4 py-3"
        open={moreOpen}
        onToggle={(event) => {
          setMoreOpen(event.currentTarget.open);
        }}
      >
        <summary className="cursor-pointer text-base font-semibold">Más opciones</summary>
        <div className="mt-4 grid gap-5">
          <div className="grid gap-2">
            <label htmlFor={`${nameId}-prep`} className="text-sm font-medium">
              Minutos de preparación antes
            </label>
            <p className="text-muted-foreground text-sm">Ocupan la agenda.</p>
            <input
              id={`${nameId}-prep`}
              name="prepMinutes"
              type="number"
              min={0}
              step={1}
              defaultValue={prepDefault}
              className={FIELD_CLASS}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${nameId}-cleanup`} className="text-sm font-medium">
              Minutos de limpieza después
            </label>
            <p className="text-muted-foreground text-sm">Ocupan la agenda.</p>
            <input
              id={`${nameId}-cleanup`}
              name="cleanupMinutes"
              type="number"
              min={0}
              step={1}
              defaultValue={cleanupDefault}
              className={FIELD_CLASS}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${nameId}-earliest`} className="text-sm font-medium">
              No ofrecer este servicio antes de
            </label>
            <input
              id={`${nameId}-earliest`}
              name="earliestStart"
              type="time"
              defaultValue={earliestDefault ?? ""}
              className={FIELD_CLASS}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${nameId}-latest`} className="text-sm font-medium">
              Ni después de
            </label>
            <input
              id={`${nameId}-latest`}
              name="latestStart"
              type="time"
              defaultValue={latestDefault ?? ""}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </details>
    </>
  );
}
