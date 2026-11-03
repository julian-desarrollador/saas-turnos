import { platformColors } from "@/core/platform-brand";

/** Proporción del símbolo (ancho / alto del viewBox). */
const RATIO = 276 / 366;

type PlatformMarkProps = {
  /** Alto en px. Si falta, el tamaño lo da `className`. */
  size?: number;
  className?: string;
  /** "color": petróleo y durazno. "mono": todo en currentColor, para fondos oscuros o un solo color. */
  variant?: "color" | "mono";
};

/**
 * Símbolo de la plataforma: una "t" cuyo travesaño es un bloque de agenda con el turno marcado
 * (docs/22-marketing.md §12). Es decorativo: el nombre va escrito al lado.
 */
export function PlatformMark({ size, className, variant = "color" }: PlatformMarkProps) {
  const stem = variant === "color" ? platformColors.ink : "currentColor";
  const bar = variant === "color" ? platformColors.accent : "currentColor";
  return (
    <svg
      viewBox="128 84 276 366"
      width={size ? Math.round(size * RATIO) : undefined}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path fill={stem} d="M196 120a31 31 0 0 1 62 0V182H196Z" />
      <path
        fill={stem}
        d="M196 274H258V330c0 34 22 52 56 52h36a31 31 0 0 1 0 62h-36C246 444 196 404 196 336Z"
      />
      <path
        fill={bar}
        fillRule="evenodd"
        d="M166 196h200a32 32 0 0 1 0 64H166a32 32 0 0 1 0-64ZM348 228a15 15 0 1 0 30 0a15 15 0 1 0-30 0Z"
      />
    </svg>
  );
}
