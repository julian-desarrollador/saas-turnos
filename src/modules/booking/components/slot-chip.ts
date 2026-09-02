export function slotChipClassName(selected: boolean): string {
  return selected
    ? "border-primary bg-primary text-primary-foreground inline-flex min-h-10 min-w-14 items-center justify-center rounded-lg border px-3 font-mono text-sm"
    : "border-border hover:bg-muted inline-flex min-h-10 min-w-14 items-center justify-center rounded-lg border px-3 font-mono text-sm";
}
