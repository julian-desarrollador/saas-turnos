/**
 * Plantilla A, editorial (docs/23-public-site-design.md §4). Las clases van
 * completas para que Tailwind las encuentre; el acento de cada negocio llega
 * aparte como `PublicAccent` porque la paleta pertenece a tenant-config.
 */
export const publicTheme = {
  page: "bg-[#f7f4ef] text-[#1c1917] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-default [&_label:has(input[type=checkbox])]:cursor-pointer",
  surface: "bg-white",
  display: "font-[family-name:var(--font-public-display)]",
  muted: "text-[#78716c]",
  line: "border-[#e7e0d5]",
  dark: "bg-[#1c1917] text-[#f7f4ef]",
  eyebrow: "text-[11px] font-medium uppercase tracking-[0.22em]",
  primary:
    "flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1c1917] px-5 text-xs font-medium uppercase tracking-[0.18em] text-[#f7f4ef] disabled:opacity-40",
  secondary:
    "flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#1c1917] px-5 text-xs font-medium uppercase tracking-[0.18em] text-[#1c1917] disabled:opacity-40",
  link: "text-xs font-medium uppercase tracking-[0.18em] underline underline-offset-4",
  choice:
    "w-full rounded-2xl border border-[#e7e0d5] bg-white px-4 py-4 text-left disabled:opacity-60",
  choiceSelected:
    "w-full rounded-2xl border border-[#1c1917] bg-white px-4 py-4 text-left ring-1 ring-[#1c1917]",
  input:
    "w-full rounded-2xl border border-[#e7e0d5] bg-white px-4 py-3 text-base font-normal tracking-normal normal-case text-[#1c1917] outline-none focus:border-[#1c1917]",
  label: "grid gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#78716c]",
  error: "text-sm text-red-800",
} as const;

export type PublicAccent = {
  /** Etiquetas y menú activo. */
  text: string;
  /** Día elegido y barra de avance. */
  solid: string;
  /** Sombra del día elegido, del mismo color que el acento. */
  glow: string;
};

export const neutralAccent: PublicAccent = {
  text: "text-[#1c1917]",
  solid: "bg-[#1c1917] text-[#f7f4ef]",
  glow: "shadow-[0_4px_16px_rgba(28,25,23,0.35)]",
};

/** Primera letra en mayúscula para mostrar. El resto queda como se guardó. */
export function publicName(value: string): string {
  const text = value.trim();
  if (!text) {
    return value;
  }
  return text.charAt(0).toLocaleUpperCase("es-AR") + text.slice(1);
}

export function formatLongDate(localDate: string): string {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  const text = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function whatsappHref(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}

export const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "·";
}
