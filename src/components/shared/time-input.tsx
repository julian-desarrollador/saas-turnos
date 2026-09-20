"use client";

import { useRef, type ChangeEvent, type ComponentProps } from "react";

import {
  closeTimePickerOnComplete,
  openNativeTimePicker,
} from "@/components/shared/close-time-picker";
import { cn } from "@/lib/utils";

const timeInputHitClass = "time-input-hit";

function useTimePickerDismiss() {
  const taps = useRef(0);
  return {
    onFocus() {
      taps.current = 0;
    },
    onPointerDown(event: { currentTarget: HTMLInputElement }) {
      openNativeTimePicker(event.currentTarget);
    },
    onChange(event: ChangeEvent<HTMLInputElement>) {
      closeTimePickerOnComplete(event, taps);
    },
  };
}

export function TimeInput({
  className,
  onChange,
  onFocus,
  onPointerDown,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const picker = useTimePickerDismiss();
  return (
    <input
      type="time"
      {...props}
      className={cn(timeInputHitClass, className)}
      onFocus={(event) => {
        picker.onFocus();
        onFocus?.(event);
      }}
      onPointerDown={(event) => {
        picker.onPointerDown(event);
        onPointerDown?.(event);
      }}
      onChange={(event) => {
        onChange?.(event);
        picker.onChange(event);
      }}
    />
  );
}
