import type { ChangeEvent, MutableRefObject } from "react";

/** Chrome en Android deja el reloj abierto hasta el segundo tap (hora, después minuto). */
export function countTimePickerTap(
  previousTaps: number,
  value: string,
): { taps: number; shouldBlur: boolean } {
  if (!/^\d{2}:\d{2}/.test(value)) {
    return { taps: previousTaps, shouldBlur: false };
  }
  const taps = previousTaps + 1;
  return { taps, shouldBlur: taps >= 2 };
}

export function closeTimePickerOnComplete(
  event: ChangeEvent<HTMLInputElement>,
  taps: MutableRefObject<number>,
) {
  const next = countTimePickerTap(taps.current, event.target.value);
  taps.current = next.taps;
  if (next.shouldBlur) {
    event.currentTarget.blur();
  }
}

/** Abre el reloj nativo al tocar el campo, no solo el icono. */
export function openNativeTimePicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== "function") {
    return;
  }
  try {
    input.showPicker();
  } catch {
    // NotAllowedError, picker ya abierto, o el motor no lo permite.
  }
}
