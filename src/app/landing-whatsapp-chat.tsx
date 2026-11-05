"use client";

import {
  ArrowLeft,
  Camera,
  EllipsisVertical,
  ExternalLink,
  Mic,
  Paperclip,
  Reply,
  Sticker,
} from "lucide-react";
import { Roboto } from "next/font/google";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PhoneFrame } from "./landing-phone-frame";

/*
 * Chat de WhatsApp de la portada, en Android con modo oscuro: colores y medidas tomados de una
 * captura real. Es una demostración (docs/22-marketing.md §12): el negocio y los datos son de
 * ejemplo, y responder con estos botones todavía no existe en el producto (docs/10 §7).
 *
 * Al entrar en pantalla la conversación avanza sola, y el visitante puede tocar un botón. Quien
 * reduce las animaciones, o no tiene JavaScript, ve la conversación completa con "Confirmar".
 */

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const TIME_ZONE = "America/Argentina/Buenos_Aires";
const BUSINESS = "Aster Studio";
const CLIENT = "Flor";

// Pasos de la conversación, en orden.
const HISTORY = 0;
const REMINDER = 1;
const PRESSED = 2;
const SENT = 3;
const DELIVERED = 4;
const READ = 5;
const TYPING = 6;
const CLOSED = 7;
/** Cuánto dura cada paso antes de pasar al siguiente, en milisegundos. */
const STEP_MS = [800, 4500, 260, 350, 500, 350, 1400];

const CHOICES = ["Confirmar", "Cancelar", "Reprogramar"] as const;
type Choice = (typeof CHOICES)[number];

const CLOSING: Record<Choice, { text: string; link?: string }> = {
  Confirmar: { text: `¡Listo, ${CLIENT}! Tu turno quedó confirmado. ¡Te esperamos mañana!` },
  Cancelar: { text: "Listo, cancelamos tu turno.", link: "Reservar turno" },
  Reprogramar: { text: "Dale. Elegí tu nuevo horario acá:", link: "Ver horarios" },
};

/** Dibujitos del fondo, propios: peluquería y agenda, cada uno en una caja de 24 px. */
const DOODLES: readonly (readonly [number, number, number, string])[] = [
  [
    14,
    12,
    -14,
    '<circle cx="5" cy="19" r="3.2"/><circle cx="14" cy="21" r="3.2"/><path d="M7 16.5 17 1M12 18 3 2"/>',
  ],
  [66, 20, 8, '<circle cx="12" cy="12" r="11"/><path d="M12 5v7l5 3"/>'],
  [118, 8, 12, '<path d="M1 6h22v4H1zM3 10v8M6.5 10v8M10 10v8M13.5 10v8M17 10v8M20.5 10v8"/>'],
  [172, 22, -10, '<path d="M12 21S2 14.5 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6.5-10 13-10 13z"/>'],
  [
    30,
    66,
    10,
    '<rect x="1" y="4" width="22" height="19" rx="2.5"/><path d="M1 10h22M7 1v6M17 1v6M6 15h3M11 15h3M16 15h3M6 19h3M11 19h3"/>',
  ],
  [84, 74, -8, '<path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"/>'],
  [134, 62, 14, '<circle cx="12" cy="8" r="8"/><path d="M12 16v8M8.5 24h7M8 6a5 5 0 0 1 3-2.6"/>'],
  [184, 76, -6, '<path d="M9 1h6v8H9zM7 9h10l1 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z"/>'],
  [10, 124, -6, '<path d="M12 1s8 9 8 14a8 8 0 0 1-16 0c0-5 8-14 8-14z"/>'],
  [
    60,
    130,
    12,
    '<path d="M3 3h18a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-6 5v-5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>',
  ],
  [
    112,
    120,
    -12,
    '<circle cx="5" cy="19" r="3.2"/><circle cx="14" cy="21" r="3.2"/><path d="M7 16.5 17 1M12 18 3 2"/>',
  ],
  [162, 132, 6, '<circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.5 3.5L17 9"/>'],
  [36, 178, 8, '<path d="M1 6h22v4H1zM3 10v8M6.5 10v8M10 10v8M13.5 10v8M17 10v8M20.5 10v8"/>'],
  [92, 186, -10, '<path d="M12 1s8 9 8 14a8 8 0 0 1-16 0c0-5 8-14 8-14z"/>'],
  [146, 180, 10, '<path d="M12 21S2 14.5 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6.5-10 13-10 13z"/>'],
  [192, 186, -14, '<path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"/>'],
  [46, 4, 0, '<circle cx="12" cy="12" r="2.6"/>'],
  [100, 44, 0, '<path d="M12 8.5v7M8.5 12h7"/>'],
  [160, 50, 0, '<path d="M9 15l6-6"/>'],
  [4, 94, 0, '<path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>'],
  [60, 104, 0, '<circle cx="12" cy="12" r="2.6"/>'],
  [112, 92, 0, '<path d="M12 8.5v7M8.5 12h7"/>'],
  [168, 106, 0, '<path d="M9 15l6-6"/>'],
  [44, 156, 0, '<path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>'],
  [100, 160, 0, '<circle cx="12" cy="12" r="2.6"/>'],
  [150, 152, 0, '<path d="M12 8.5v7M8.5 12h7"/>'],
  [206, 152, 0, '<path d="M9 15l6-6"/>'],
  [8, 190, 0, '<path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>'],
  [70, 206, 0, '<circle cx="12" cy="12" r="2.6"/>'],
  [128, 206, 0, '<path d="M12 8.5v7M8.5 12h7"/>'],
  [180, 212, 0, '<path d="M9 15l6-6"/>'],
  [208, 44, 0, '<path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>'],
];

const WALLPAPER = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" fill="none" stroke="#292e32" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${DOODLES.map(
    ([x, y, rotate, shape]) =>
      `<g transform="translate(${x} ${y}) rotate(${rotate} 12 12)">${shape}</g>`,
  ).join("")}</svg>`,
)}")`;

/** La fecha de mañana en Argentina, como la muestra el recordatorio: 17/10/2026. */
function tomorrowInArgentina(): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function Emoji({ children }: { children: string }) {
  return <span className="text-[19px] leading-none">{children}</span>;
}

function DetailRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="flex min-h-[27px] items-center gap-[6px]">
      <Emoji>{icon}</Emoji>
      <span>{children}</span>
    </span>
  );
}

function Address() {
  return (
    <>
      Calle <span className="text-[#1cc260] underline underline-offset-2">12 - 1450</span>
    </>
  );
}

/** Puntita de la burbuja: arriba, del lado de quien escribe. */
function Tail({ side }: { side: "in" | "out" }) {
  return (
    <svg
      viewBox="0 0 8 13"
      aria-hidden="true"
      className={cn(
        "absolute top-0 h-[13px] w-[8px]",
        side === "out" ? "-right-[7px] text-[#134d37]" : "-left-[7px] -scale-x-100 text-[#1f272a]",
      )}
      fill="currentColor"
    >
      <path d="M0 0h5.2C7.4 0 8.5 2.3 7.2 4L0 13z" />
    </svg>
  );
}

type TickState = "sent" | "delivered" | "read";

function Ticks({ state }: { state: TickState }) {
  return (
    <svg
      viewBox="0 0 16 11"
      aria-hidden="true"
      className={cn(
        "h-[11px] w-[16px] transition-colors duration-200",
        state === "read" ? "text-[#53bdeb]" : "text-[#aaccbe]",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 6l3.2 3.4L10.6 1.6" />
      {state === "sent" ? null : <path d="M7.6 8.6l.9.8L15 1.6" />}
    </svg>
  );
}

function Bubble({
  side,
  tail = false,
  time,
  ticks,
  className,
  before,
  after,
  children,
}: {
  side: "in" | "out";
  tail?: boolean;
  time: string;
  ticks?: TickState;
  className?: string;
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex", side === "out" ? "justify-end pr-[16px]" : "pl-[14px]")}>
      <div
        className={cn(
          "relative rounded-[8px] text-[15px] leading-[18.5px] shadow-[0_1px_0.5px_rgba(0,0,0,0.3)]",
          side === "out" ? "bg-[#134d37]" : "bg-[#1f272a]",
          tail && (side === "out" ? "rounded-tr-none" : "rounded-tl-none"),
          className,
        )}
      >
        {tail ? <Tail side={side} /> : null}
        {before}
        <div className="relative px-[7px] pt-[5px] pb-[7px]">
          {children}
          {/* Reserva el lugar de la hora en la última línea, como hace WhatsApp. */}
          <span
            aria-hidden="true"
            className={cn("inline-block", ticks ? "w-[62px]" : "w-[42px]")}
          />
          <span
            className={cn(
              "absolute right-[7px] bottom-[3px] flex items-center gap-[3px] text-[12px] leading-[14px] tabular-nums",
              side === "out" ? "text-[#aedfcc]" : "text-[#a4acaf]",
            )}
          >
            {time}
            {ticks ? <Ticks state={ticks} /> : null}
          </span>
        </div>
        {after}
      </div>
    </div>
  );
}

/** Botón de enlace de WhatsApp: abajo de la burbuja, separado por una línea fina. */
function LinkRow({ children }: { children: string }) {
  return (
    <div className="flex h-[38px] items-center justify-center gap-[6px] border-t border-[#363e41] text-[15.5px] font-medium text-[#1cc260]">
      <ExternalLink className="size-[15px]" strokeWidth={2} />
      {children}
    </div>
  );
}

/** Mensaje que entra empujando a los anteriores hacia arriba. */
function Entering({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("lp-chat-in", className)}>
      <div>{children}</div>
    </div>
  );
}

function AsterAvatar() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className="size-[28px] shrink-0 rounded-full">
      <rect width="28" height="28" fill="#f4ede4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="14"
          cy="7.6"
          rx="2.5"
          ry="5"
          fill="#8b5e83"
          transform={`rotate(${angle} 14 14)`}
        />
      ))}
      <circle cx="14" cy="14" r="3.2" fill="#e3b04b" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[19px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="2.5" width="14.5" height="15" rx="2" />
      <circle cx="14.25" cy="8" r="2.3" />
      <path d="M10.4 14.4c.7-1.5 2.1-2.4 3.85-2.4s3.15.9 3.85 2.4M3 7v12.5a2 2 0 0 0 2 2h12.5" />
    </svg>
  );
}

export function LandingWhatsAppChat({ autoPlay = false }: { autoPlay?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [step, setStep] = useState(autoPlay ? HISTORY : CLOSED);
  const [choice, setChoice] = useState<Choice>("Confirmar");
  const [date] = useState(tomorrowInArgentina);

  // Arranca cuando se ve la mitad del celular.
  useEffect(() => {
    const root = rootRef.current;
    if (playing || !root || window.matchMedia(REDUCED_MOTION).matches) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          setStep(HISTORY);
          setPlaying(true);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [playing]);

  // Avanza un paso por vez. Tocar un botón salta al paso siguiente y reinicia el temporizador.
  useEffect(() => {
    if (!playing || step >= CLOSED) {
      return;
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), STEP_MS[step]);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const ticks: TickState = step >= READ ? "read" : step >= DELIVERED ? "delivered" : "sent";
  const closing = CLOSING[choice];

  return (
    <figure
      ref={rootRef}
      aria-label={`Ejemplo de recordatorio de turno por WhatsApp de ${BUSINESS}, con botones para confirmar, cancelar o reprogramar`}
      className={cn("m-0 w-full", roboto.className)}
    >
      <PhoneFrame clock={step >= SENT ? "18:31" : "18:30"}>
        <div className="flex h-full flex-col">
          {/* Encabezado */}
          <div className="flex h-[43px] shrink-0 items-center gap-[9px] border-b border-[#151a1e] px-[12px]">
            <ArrowLeft className="size-[19px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
            <AsterAvatar />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16.5px] leading-[20px]">{BUSINESS}</p>
              {playing && step === TYPING ? (
                <p className="text-[11.5px] leading-[13px] text-[#a4acaf]">escribiendo…</p>
              ) : null}
            </div>
            <CatalogIcon />
            <EllipsisVertical className="-mr-[3px] size-[19px] shrink-0" aria-hidden="true" />
          </div>

          {/* Fondo: va detrás de los mensajes y de la barra de abajo */}
          <div
            className="flex min-h-0 flex-1 flex-col"
            style={{ backgroundImage: WALLPAPER, backgroundSize: "196px" }}
          >
            {/* Conversación: pegada abajo, lo anterior se corta bajo el encabezado */}
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-[6px] overflow-hidden pb-[8px]">
              {/* Historial: la confirmación que llegó al reservar */}
              <Bubble side="in" time="11:24" className="w-[200px]">
                ¡Hola {CLIENT}! <Emoji>😊</Emoji>
                <br />
                Tu turno quedó reservado:
                <DetailRow icon="🗓️">
                  <strong suppressHydrationWarning>{date}</strong>
                </DetailRow>
                <DetailRow icon="⏰">
                  <strong>18:30 hs</strong>
                </DetailRow>
                <DetailRow icon="📍">
                  <Address />
                </DetailRow>
                <br />
                ¡Te esperamos!
              </Bubble>

              {/* Lo que pasa hoy. Se oculta hasta que arranca; con <noscript> se ve igual. */}
              <noscript>
                <style>{".lp-chat-today{display:flex!important}"}</style>
              </noscript>
              <div
                className={cn(
                  "lp-chat-today flex flex-col gap-[6px]",
                  !playing && "motion-safe:hidden",
                )}
              >
                {step >= REMINDER ? (
                  <Entering>
                    <p className="pb-[6px] text-center">
                      <span className="inline-block rounded-[7px] bg-[#1f272a] px-[9px] py-[3px] text-[12px] leading-[15px] font-medium text-[#a4acaf]">
                        Hoy
                      </span>
                    </p>
                    <Bubble
                      side="in"
                      tail
                      time="18:30"
                      className="w-[200px]"
                      after={
                        <div className="overflow-hidden rounded-b-[8px]">
                          {CHOICES.map((option) => {
                            const used = step >= PRESSED && choice === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={step !== REMINDER}
                                onClick={() => {
                                  setChoice(option);
                                  setStep(PRESSED);
                                }}
                                className={cn(
                                  "flex h-[38px] w-full items-center justify-center gap-[6px] border-t border-[#363e41] text-[15.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1cc260] disabled:cursor-default",
                                  used ? "text-[#6e7679]" : "text-[#1cc260]",
                                  step === REMINDER && "hover:bg-white/5 active:bg-white/10",
                                  used && step === PRESSED && "bg-white/10",
                                )}
                              >
                                <Reply className="size-[16px]" strokeWidth={2} aria-hidden="true" />
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      }
                    >
                      ¡Hola {CLIENT}! <Emoji>😊</Emoji>
                      <br />
                      Te recordamos tu turno para mañana:
                      <DetailRow icon="🗓️">
                        <strong suppressHydrationWarning>{date}</strong>
                      </DetailRow>
                      <DetailRow icon="⏰">
                        <strong>18:30 hs</strong>
                      </DetailRow>
                      <DetailRow icon="📍">
                        <Address />
                      </DetailRow>
                      <br />
                      ¿Qué necesitás hacer?
                    </Bubble>
                  </Entering>
                ) : null}

                {step >= SENT ? (
                  <Entering>
                    <Bubble
                      side="out"
                      tail
                      time="18:31"
                      ticks={ticks}
                      className="w-[250px]"
                      before={
                        <div className="m-[3px] mb-0 flex overflow-hidden rounded-[6px] bg-[#0f4535]">
                          <span className="w-[4px] shrink-0 bg-[#a78fff]" />
                          <div className="min-w-0 px-[8px] py-[5px]">
                            <p className="text-[13.5px] leading-[17px] font-medium text-[#c8bef6]">
                              {BUSINESS}
                            </p>
                            <p className="text-[14px] leading-[19px] text-[#b4cec5]">
                              ¡Hola {CLIENT}! <Emoji>😊</Emoji>
                              <br />
                              Te recordamos tu turno para
                              <br />
                              mañana:…
                            </p>
                          </div>
                        </div>
                      }
                    >
                      {choice}
                    </Bubble>
                  </Entering>
                ) : null}

                {step >= CLOSED ? (
                  <Entering>
                    <Bubble
                      side="in"
                      tail
                      time="18:31"
                      className="max-w-[235px]"
                      after={closing.link ? <LinkRow>{closing.link}</LinkRow> : null}
                    >
                      {closing.text}
                    </Bubble>
                  </Entering>
                ) : null}
              </div>
            </div>

            {/* Barra para escribir */}
            <div
              aria-hidden="true"
              className="flex shrink-0 items-center gap-[7px] px-[9px] pb-[24px]"
            >
              <div className="flex h-[37px] min-w-0 flex-1 items-center gap-[11px] rounded-full bg-[#1f272a] px-[10px] text-[#a1a9ac]">
                <Sticker className="size-[19px] shrink-0" strokeWidth={1.9} />
                <span className="min-w-0 flex-1 truncate text-[16px] leading-none">Mensaje</span>
                <Paperclip className="size-[18px] shrink-0" strokeWidth={1.9} />
                <Camera className="size-[19px] shrink-0" strokeWidth={1.9} />
              </div>
              <div className="flex size-[37px] shrink-0 items-center justify-center rounded-full bg-white text-[#0b1014]">
                <Mic className="size-[18px]" strokeWidth={2.2} />
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </figure>
  );
}
