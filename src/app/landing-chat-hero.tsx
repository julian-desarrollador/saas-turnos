"use client";

/* eslint-disable @next/next/no-img-element -- réplica del diseño: avatares remotos de Unsplash. */
import Link from "next/link";
import type { Route } from "next";
import { useRef, useState } from "react";

import { LandingWhatsAppChat } from "./landing-whatsapp-chat";

/*
 * Sección "Clean Editorial" de la portada: el texto a la izquierda y un celular con un chat de
 * WhatsApp a la derecha (docs/22-marketing.md §12). El texto, los números y las fotos son los del
 * diseño y se corrigen en una vuelta siguiente. El chat está en landing-whatsapp-chat.tsx.
 */

const ALTA = "/alta" as Route;

export function LandingChatHero() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const [chatRun, setChatRun] = useState(0);

  function restartChat() {
    phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setChatRun((run) => run + 1);
    }
  }

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#faf8ff] via-[#f7f6fd] to-white px-4 pt-12 pb-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Columna izquierda: texto y botones */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                CERO MENSAJES ETERNOS
              </span>
              <span className="text-xs font-medium text-slate-500">Integrado a Mercado Pago</span>
            </div>

            <h2 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Dejá de contestar <br className="hidden sm:block" />
              <span className="font-serif text-indigo-600 italic">“¿tenés turno?”</span> a deshoras.
            </h2>

            <p className="max-w-xl text-lg leading-relaxed font-normal text-slate-600 sm:text-xl">
              Tus clientes eligen fecha, reservan en 30 segundos y pagan su seña antes de confirmar.
              Tu agenda se llena sola mientras atendés o descansás.
            </p>

            <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
              <Link
                href={ALTA}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
              >
                <span>Empezar prueba gratis</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </Link>

              <button
                type="button"
                onClick={restartChat}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                <span>Probar chat interactivo</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                <img
                  className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Usuario"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Usuario"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Usuario"
                />
              </div>
              <span className="text-xs font-medium text-slate-600">
                <strong className="font-bold text-slate-900">+5.800 profesionales</strong> en
                Argentina y la región ya no pierden turnos ni dinero.
              </span>
            </div>
          </div>

          {/* Columna derecha: celular y tarjetas */}
          <div className="relative mt-6 flex flex-col items-center gap-4 lg:col-span-5 lg:mt-0 xl:items-end">
            <div className="absolute inset-0 -z-10 mx-auto max-w-sm rounded-full bg-indigo-500/10 blur-3xl xl:mr-0"></div>

            <div ref={phoneRef} className="relative w-[340px] max-w-full scroll-mt-24">
              <LandingWhatsAppChat key={chatRun} autoPlay={chatRun > 0} />
            </div>

            {/* Tarjeta: señas cobradas hoy. Desde xl flota al costado y solo pisa el borde. */}
            <div className="z-20 flex w-full max-w-[340px] items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-md xl:absolute xl:top-[110px] xl:right-[330px] xl:w-max xl:max-w-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-600">
                💳
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Señas cobradas hoy
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  $48.500{" "}
                  <span className="text-[11px] font-semibold text-emerald-600">
                    • 100% efectivas
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta: ausencias */}
            <div className="z-20 w-full max-w-[340px] rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md xl:absolute xl:right-[330px] xl:bottom-[90px] xl:w-[210px]">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Ausencias</span>
                <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                  -94% no-shows
                </span>
              </div>
              <div className="text-xs leading-tight font-bold text-slate-800">
                0 citas perdidas esta semana
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Con la seña automática nadie te planta a último minuto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
