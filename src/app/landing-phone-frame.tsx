import type { ReactNode } from "react";

/*
 * Android genérico, sin marca, para la portada: borde metálico, bisel fino, cámara al centro,
 * barra de estado y barra de gestos. Lo que va en la pantalla lo pone quien lo usa.
 */

const SIDE_BUTTON =
  "absolute -right-[2px] w-[3px] rounded-r-[2px] bg-linear-to-b from-[#4a4e54] via-[#24272b] to-[#4a4e54]";

function StatusBar({ clock }: { clock: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[26px] shrink-0 items-center justify-between px-[18px] pt-[3px]"
    >
      <span className="text-[12.5px] leading-none font-medium tabular-nums">{clock}</span>

      {/* Cámara */}
      <span className="absolute top-[6px] left-1/2 flex size-[12px] -translate-x-1/2 items-center justify-center rounded-full bg-black ring-1 ring-white/10">
        <span className="size-[4px] rounded-full bg-[#141c33]" />
      </span>

      <span className="flex items-center gap-[5px]">
        {/* Wifi */}
        <svg viewBox="0 0 16 12" className="h-[10px] w-[13px]" fill="currentColor">
          <path d="M8 11.6.5 3.9C2.5 1.9 5.1.8 8 .8s5.5 1.1 7.5 3.1z" />
        </svg>
        {/* Señal */}
        <svg viewBox="0 0 12 12" className="size-[10px]" fill="currentColor">
          <path d="M11.5.5v11H.5z" />
        </svg>
        {/* Batería */}
        <svg viewBox="0 0 24 12" className="h-[10px] w-[20px]">
          <rect
            x="0.6"
            y="0.6"
            width="20.3"
            height="10.8"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".45"
            strokeWidth="1.2"
          />
          <rect x="2" y="2" width="14" height="8" rx="1.7" fill="currentColor" />
          <path d="M22.2 4v4c.9-.3 1.5-1.1 1.5-2s-.6-1.7-1.5-2z" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  );
}

export function PhoneFrame({ clock, children }: { clock: string; children: ReactNode }) {
  return (
    <div className="relative w-full">
      {/* Volumen y encendido */}
      <span aria-hidden="true" className={`${SIDE_BUTTON} top-[138px] h-[70px]`} />
      <span aria-hidden="true" className={`${SIDE_BUTTON} top-[224px] h-[40px]`} />

      {/* Borde metálico */}
      <div className="rounded-[42px] bg-linear-to-br from-[#666a71] via-[#1d1f23] to-[#4f5359] p-[2px] shadow-[0_2px_4px_rgba(15,23,42,0.28),0_30px_60px_-20px_rgba(15,23,42,0.5),0_70px_110px_-40px_rgba(79,70,229,0.4)]">
        {/* Bisel */}
        <div className="rounded-[40px] bg-black p-[9px]">
          {/* Pantalla */}
          <div className="relative flex aspect-[318/685] flex-col overflow-hidden rounded-[31px] bg-[#0b1014] text-[#fbffff]">
            <StatusBar clock={clock} />
            <div className="min-h-0 flex-1">{children}</div>

            {/* Barra de gestos */}
            <span
              aria-hidden="true"
              className="absolute bottom-[7px] left-1/2 h-[3.5px] w-[104px] -translate-x-1/2 rounded-full bg-white/85"
            />
            {/* Reflejo del vidrio */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_22%,transparent_38%)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
