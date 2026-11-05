/* eslint-disable @next/next/no-img-element, @next/next/no-page-custom-font, @next/next/google-font-display -- réplica de Stitch: fotos remotas e íconos Material Symbols. */
import Link from "next/link";
import type { Route } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SignInButton, UserButton } from "@clerk/nextjs";

import { PlatformLogo } from "@/components/shared/platform-logo";
import { panelPath } from "@/core/panel-routes";
import { platformName } from "@/core/platform-brand";
import { loadPlatformHome } from "@/server/auth";

import { LandingAgendaPreview } from "./landing-agenda-preview";
import { LandingChatHero } from "./landing-chat-hero";
import { DemoScrollButton, LandingRubros } from "./landing-rubros";

/*
 * Portada de la plataforma. Réplica 1:1 del diseño de Stitch (docs/22-marketing.md §12):
 * el texto, los números y los precios son los del diseño y se corrigen en vueltas siguientes.
 * Tokens `lp-*` en globals.css.
 */

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

const ALTA = "/alta" as Route;
const FILL = { fontVariationSettings: "'FILL' 1" } as const;

export default async function HomePage() {
  const home = await loadPlatformHome();
  const signedIn = home.signedIn;
  const first = home.businesses[0];
  const agendaHref = (first ? panelPath(first.slug, "agenda") : "/alta") as Route;

  return (
    <div
      className={`lp-root ${jakarta.className} bg-lp-surface text-lp-body-md text-lp-on-surface min-h-svh overscroll-none antialiased`}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        precedence="default"
      />
      <header className="bg-lp-surface-container-lowest/90 fixed top-0 right-0 left-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="px-lp-margin gap-lp-space-md mx-auto flex h-20 max-w-[1240px] items-center justify-between">
          <div className="gap-lp-space-lg flex items-center">
            <a className="flex items-center" href="#" aria-label={`${platformName}, inicio`}>
              <PlatformLogo size={30} />
            </a>
            <nav className="gap-lp-space-lg hidden items-center xl:flex">
              <a
                className="text-lp-body-md text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Funcionalidades
              </a>
              <a
                className="text-lp-body-md text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Rubros
              </a>
              <a
                className="text-lp-body-md text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Integraciones
              </a>
              <a
                className="text-lp-body-md text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Precios
              </a>
              <a
                className="text-lp-body-md text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Testimonios
              </a>
            </nav>
          </div>
          <div className="gap-lp-space-md flex items-center">
            <div className="gap-lp-space-xs bg-lp-surface-container-low px-lp-space-sm py-lp-space-xs hidden items-center rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:flex">
              <span className="text-lp-label-sm text-lp-on-surface-variant px-lp-space-xs">
                {" "}
                AR
              </span>
              <span className="text-lp-outline-variant text-lp-label-sm">|</span>
              <span className="text-lp-label-sm text-lp-on-surface px-lp-space-xs font-bold">
                LATAM
              </span>
            </div>
            {signedIn ? (
              <Link
                className="text-lp-label-lg text-lp-on-surface-variant hover:text-lp-on-surface px-lp-space-sm py-lp-space-xs hidden items-center transition-colors md:inline-flex"
                href={agendaHref}
              >
                Mi agenda
              </Link>
            ) : (
              <SignInButton>
                <button
                  type="button"
                  className="text-lp-label-lg text-lp-on-surface-variant hover:text-lp-on-surface px-lp-space-sm py-lp-space-xs hidden items-center transition-colors md:inline-flex"
                >
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
            <Link
              className="text-lp-label-lg text-lp-on-primary bg-lp-primary-container px-lp-space-md py-lp-space-sm rounded-lp-lg hover:bg-lp-primary inline-flex items-center justify-center shadow-[0_6px_16px_-2px_rgba(79,70,229,0.35)] transition-all active:scale-95"
              href={ALTA}
            >
              Comenzar gratis
            </Link>
            {signedIn ? (
              <UserButton />
            ) : (
              <div className="bg-lp-primary flex h-8 w-8 items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-lp-on-primary text-[18px]">
                  person
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="bg-lp-surface w-full pt-20">
        <div className="flex w-full flex-col">
          {/* HERO SECTION */}
          <section className="from-lp-surface via-lp-surface-container-low to-lp-surface pt-lp-space-xl relative w-full overflow-hidden bg-linear-to-b/srgb">
            {/* Atmospheric Ambient Glows */}
            <div className="bg-lp-primary/10 pointer-events-none absolute top-10 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full blur-[120px]"></div>
            <div className="bg-lp-secondary-container/20 pointer-events-none absolute -top-20 right-10 h-[420px] w-[420px] rounded-full blur-[90px]"></div>
            <div className="px-lp-margin relative mx-auto max-w-[1240px]">
              {/* Main Catchphrase & Pitch */}
              <div className="mb-lp-space-xl mx-auto max-w-4xl text-center">
                <h1 className="text-lp-headline-xl text-lp-on-surface mb-lp-space-md tracking-tight">
                  La agenda de turnos online que trabaja por vos y{" "}
                  <span className="from-lp-primary to-lp-primary-container bg-linear-to-r/srgb bg-clip-text text-transparent">
                    llena tu salón 24/7
                  </span>
                </h1>
                <p className="text-lp-body-lg text-lp-on-surface-variant mx-auto max-w-2xl leading-relaxed">
                  Dejá de contestar{" "}
                  <span className="text-lp-on-surface font-semibold">“¿tenés turno?”</span> a
                  deshoras. Tus clientes reservan solos desde tu link personalizado, confirmás por
                  WhatsApp automático y cobrás señas con MercadoPago sin vueltas ni ausencias.
                </p>
                {/* CTA Cluster */}
                <div className="gap-lp-space-md mt-lp-space-lg mb-lp-space-sm flex flex-col items-center justify-center sm:flex-row">
                  <Link
                    className="gap-lp-space-xs text-lp-label-lg text-lp-on-primary bg-lp-primary-container px-lp-space-xl rounded-lp-lg hover:bg-lp-primary inline-flex w-full items-center justify-center py-3.5 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98] sm:w-auto"
                    href={ALTA}
                  >
                    <span>Empezar gratis (14 días)</span>
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </Link>
                  <DemoScrollButton className="gap-lp-space-xs text-lp-label-lg text-lp-on-surface bg-lp-surface-container-lowest px-lp-space-lg rounded-lp-lg hover:bg-lp-surface-container inline-flex w-full items-center justify-center py-3.5 shadow-xs transition-all hover:shadow-sm sm:w-auto">
                    <span
                      className="material-symbols-outlined text-lp-primary text-[20px]"
                      style={FILL}
                    >
                      play_circle
                    </span>
                    <span>Ver demo interactiva</span>
                  </DemoScrollButton>
                </div>
                <div className="gap-lp-space-md text-lp-on-surface-variant flex flex-wrap items-center justify-center">
                  <span className="text-lp-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-lp-secondary text-[14px]">
                      check_circle
                    </span>
                    Sin tarjeta de crédito
                  </span>
                  <span className="text-lp-label-sm text-lp-outline-variant">•</span>
                  <span className="text-lp-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-lp-secondary text-[14px]">
                      check_circle
                    </span>
                    Activación en 2 minutos
                  </span>
                  <span className="text-lp-label-sm text-lp-outline-variant">•</span>
                  <span className="text-lp-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-lp-secondary text-[14px]">
                      check_circle
                    </span>
                    Cancela cuando quieras
                  </span>
                </div>
                {/* Social Proof Micro Badge */}
                <div className="gap-lp-space-xs mt-lp-space-md bg-lp-surface-container-lowest/80 px-lp-space-md inline-flex items-center rounded-full py-1.5 shadow-xs backdrop-blur-sm">
                  <div className="flex text-amber-500">
                    <span className="material-symbols-outlined text-[16px]" style={FILL}>
                      star
                    </span>
                    <span className="material-symbols-outlined text-[16px]" style={FILL}>
                      star
                    </span>
                    <span className="material-symbols-outlined text-[16px]" style={FILL}>
                      star
                    </span>
                    <span className="material-symbols-outlined text-[16px]" style={FILL}>
                      star
                    </span>
                    <span className="material-symbols-outlined text-[16px]" style={FILL}>
                      star
                    </span>
                  </div>
                  <span className="text-lp-label-sm text-lp-on-surface font-semibold">
                    4.9/5 estrellas
                  </span>
                  <span className="text-lp-on-surface-variant text-lp-label-sm">
                    en más de 2.400 reseñas de salones y clínicas
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* SECCIÓN CLEAN EDITORIAL: CELULAR CON WHATSAPP */}
          <LandingChatHero />
          {/* AGENDA: VISTA PREVIA DEL PANEL */}
          <LandingAgendaPreview />
          {/* SOCIAL PROOF STATS BAND */}
          <section className="bg-lp-surface-container-lowest py-lp-space-xl w-full shadow-xs">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <div className="gap-lp-gutter grid grid-cols-2 text-center md:grid-cols-4">
                <div className="flex flex-col items-center">
                  <span className="text-lp-headline-lg text-lp-primary font-extrabold tracking-tight">
                    +5.800
                  </span>
                  <span className="text-lp-title-sm text-lp-on-surface mt-1">Negocios activos</span>
                  <p className="text-lp-body-sm text-lp-on-surface-variant">
                    En Argentina y América Latina
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lp-headline-lg text-lp-on-surface font-extrabold tracking-tight">
                    2.4M+
                  </span>
                  <span className="text-lp-title-sm text-lp-on-surface mt-1">
                    Turnos gestionados
                  </span>
                  <p className="text-lp-body-sm text-lp-on-surface-variant">
                    Con confirmación en vivo
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lp-headline-lg text-lp-secondary font-extrabold tracking-tight">
                    -82%
                  </span>
                  <span className="text-lp-title-sm text-lp-on-surface mt-1">Tasa de no-shows</span>
                  <p className="text-lp-body-sm text-lp-on-surface-variant">
                    Al cobrar seña automática
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lp-headline-lg text-lp-on-surface font-extrabold tracking-tight">
                    $0
                  </span>
                  <span className="text-lp-title-sm text-lp-on-surface mt-1">
                    Costo de instalación
                  </span>
                  <p className="text-lp-body-sm text-lp-on-surface-variant">
                    Sin contratos ni permanencias
                  </p>
                </div>
              </div>
            </div>
          </section>
          <LandingRubros />
          {/* BENTO GRID DE FUNCIONALIDADES */}
          <section className="py-lp-space-xl bg-lp-surface-container-low w-full">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <div className="mb-lp-space-xl mx-auto max-w-2xl text-center">
                <span className="text-lp-label-sm text-lp-primary font-bold tracking-wider uppercase">
                  Ecosistema Integral Pro
                </span>
                <h2 className="text-lp-headline-lg text-lp-on-surface mt-1 tracking-tight">
                  Todo lo que necesitás para no perder ni un solo turno
                </h2>
                <p className="text-lp-body-md text-lp-on-surface-variant mt-2">
                  Diseñado para erradicar las horas perdidas en WhatsApp, las cancelaciones de
                  último momento y la doble reserva.
                </p>
              </div>
              {/* Bento Grid (3 columns on desktop) */}
              <div className="gap-lp-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: Agenda Inteligente (Spans 2 cols on lg) */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md lg:col-span-2">
                  <div>
                    <div className="rounded-lp-xl bg-lp-primary-fixed text-lp-primary mb-lp-space-md flex h-12 w-12 items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">
                        calendar_view_week
                      </span>
                    </div>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mb-2 font-bold">
                      Agenda Inteligente Multi-Profesional
                    </h3>
                    <p className="text-lp-body-md text-lp-on-surface-variant mb-lp-space-md max-w-lg">
                      Visualizá el día de todo tu equipo en columnas simultáneas. Bloqueá huecos de
                      almuerzo con un toque, configurá tiempos de limpieza entre turnos y sincronizá
                      en tiempo real con Google Calendar.
                    </p>
                  </div>
                  {/* Micro Visual Representation */}
                  <div className="bg-lp-surface-container-low rounded-lp-xl p-lp-space-md">
                    <div className="text-lp-on-surface-variant mb-2 flex items-center justify-between text-xs font-semibold">
                      <span>Sincronización bidireccional</span>
                      <span className="text-lp-secondary font-bold">Google Calendar Activo</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-lp-surface-container-lowest rounded-lp p-2">
                        <span className="text-lp-primary block font-bold">9:00 - 10:00</span>
                        <span className="text-lp-on-surface">Corte + Lavado</span>
                      </div>
                      <div className="rounded-lp bg-amber-100/70 p-2 text-amber-900">
                        <span className="block font-bold">10:00 - 10:30</span>
                        <span>Desinfección</span>
                      </div>
                      <div className="bg-lp-surface-container-lowest rounded-lp p-2">
                        <span className="text-lp-primary block font-bold">10:30 - 11:30</span>
                        <span className="text-lp-on-surface">Colorimetría</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card 2: Cobro de Señas con MercadoPago */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="rounded-lp-xl bg-lp-secondary-fixed text-lp-on-secondary-fixed mb-lp-space-md flex h-12 w-12 items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">price_check</span>
                    </div>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mb-2 font-bold">
                      Cobro de Señas con MercadoPago
                    </h3>
                    <p className="text-lp-body-md text-lp-on-surface-variant mb-lp-space-md">
                      Exigí el 30%, 50% o el total del valor antes de otorgar el turno. Quien no
                      paga la seña en 15 minutos, libera automáticamente el cupo para otro cliente.
                    </p>
                  </div>
                  <div className="rounded-lp-xl p-lp-space-md flex items-center justify-between bg-emerald-50 text-emerald-950">
                    <div>
                      <span className="block text-xs font-bold">Impacto comprobado</span>
                      <span className="text-xs">Reducción inmediata de no-shows</span>
                    </div>
                    <span className="text-lp-headline-md text-lp-secondary font-black">-85%</span>
                  </div>
                </div>
                {/* Card 3: Bot WhatsApp IA Flow */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="rounded-lp-xl mb-lp-space-md flex h-12 w-12 items-center justify-center bg-emerald-100 text-emerald-700">
                      <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                    </div>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mb-2 font-bold">
                      Robot WhatsApp Oficial (IA Flow)
                    </h3>
                    <p className="text-lp-body-md text-lp-on-surface-variant mb-lp-space-md">
                      Envía recordatorios inteligentes 24 horas y 2 horas antes de la cita. El
                      cliente confirma con un botón interactivo y la agenda se actualiza al
                      instante.
                    </p>
                  </div>
                  <div className="bg-lp-surface-container-low rounded-lp-xl p-3 text-xs">
                    <span className="text-lp-on-surface-variant mb-1 block">
                      Botón interactivo:
                    </span>
                    <div className="flex gap-2">
                      <span className="rounded-lp bg-emerald-600 px-2.5 py-1 font-bold text-white">
                        ✅ Confirmar
                      </span>
                      <span className="bg-lp-surface-container-highest text-lp-on-surface rounded-lp px-2.5 py-1 font-bold">
                        {" "}
                        Reprogramar
                      </span>
                    </div>
                  </div>
                </div>
                {/* Card 4: Link de Reservas Personalizado */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="rounded-lp-xl bg-lp-tertiary-fixed text-lp-tertiary mb-lp-space-md flex h-12 w-12 items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">link</span>
                    </div>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mb-2 font-bold">
                      Link Personalizado en tu Bio
                    </h3>
                    <p className="text-lp-body-md text-lp-on-surface-variant mb-lp-space-md">
                      Tu propio portal{" "}
                      <code className="bg-lp-surface-container-high rounded-lp text-lp-primary px-1.5 py-0.5 font-bold">
                        tunegocio.citaflow.pro
                      </code>{" "}
                      optimizado para celular, con catálogo visual de servicios, precios y fotos del
                      equipo.
                    </p>
                  </div>
                  <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center justify-between p-3 text-xs">
                    <span className="text-lp-on-surface truncate font-bold">
                      palermo.citaflow.pro
                    </span>
                    <span className="text-lp-primary font-bold">100% Mobile Ready</span>
                  </div>
                </div>
                {/* Card 5: Fichas Clínicas e Historial */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="rounded-lp-xl bg-lp-surface-container-highest text-lp-on-surface-variant mb-lp-space-md flex h-12 w-12 items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">badge</span>
                    </div>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mb-2 font-bold">
                      Fichas de Clientes & Historial
                    </h3>
                    <p className="text-lp-body-md text-lp-on-surface-variant mb-lp-space-md">
                      Guardá fórmulas exactas de tinte, tratamientos anteriores, historial de
                      asistencias, notas médicas privadas y fechas de cumpleaños con felicitación
                      automática.
                    </p>
                  </div>
                  <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 p-3 text-xs">
                    <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                      verified
                    </span>
                    <span className="text-lp-on-surface font-semibold">
                      Registro seguro bajo cifrado SSL 256
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* HOW IT WORKS IN 3 STEPS */}
          <section className="py-lp-space-xl bg-lp-surface w-full">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <div className="mb-lp-space-xl mx-auto max-w-2xl text-center">
                <span className="text-lp-label-sm text-lp-primary font-bold tracking-wider uppercase">
                  Simplicidad absoluta
                </span>
                <h2 className="text-lp-headline-lg text-lp-on-surface mt-1 tracking-tight">
                  Empezá a recibir reservas en 3 pasos sencillos
                </h2>
                <p className="text-lp-body-md text-lp-on-surface-variant mt-2">
                  Sin configuraciones engorrosas ni capacitaciones de semanas. Listo para usar en
                  menos de lo que dura un café.
                </p>
              </div>
              <div className="gap-lp-gutter relative grid grid-cols-1 md:grid-cols-3">
                {/* Step 1 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg relative flex flex-col items-start shadow-xs">
                  <div className="bg-lp-primary text-lp-on-primary mb-lp-space-md text-lp-title-md flex h-10 w-10 items-center justify-center rounded-full font-extrabold">
                    1
                  </div>
                  <h3 className="text-lp-title-md text-lp-on-surface mb-2 font-bold">
                    Configurá tu agenda en 2 min
                  </h3>
                  <p className="text-lp-body-md text-lp-on-surface-variant">
                    Cargá tus horarios disponibles, tus servicios con su respectivo valor y el
                    porcentaje de seña requerido por Mercado Pago.
                  </p>
                </div>
                {/* Step 2 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg relative flex flex-col items-start shadow-xs">
                  <div className="bg-lp-primary text-lp-on-primary mb-lp-space-md text-lp-title-md flex h-10 w-10 items-center justify-center rounded-full font-extrabold">
                    2
                  </div>
                  <h3 className="text-lp-title-md text-lp-on-surface mb-2 font-bold">
                    Pegá tu enlace en tu biografía
                  </h3>
                  <p className="text-lp-body-md text-lp-on-surface-variant">
                    Colocá tu link exclusivo en tu perfil de Instagram, en la respuesta automática
                    de WhatsApp Business o en tu página web.
                  </p>
                </div>
                {/* Step 3 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg relative flex flex-col items-start shadow-xs">
                  <div className="bg-lp-primary text-lp-on-primary mb-lp-space-md text-lp-title-md flex h-10 w-10 items-center justify-center rounded-full font-extrabold">
                    3
                  </div>
                  <h3 className="text-lp-title-md text-lp-on-surface mb-2 font-bold">
                    Tus clientes reservan solos
                  </h3>
                  <p className="text-lp-body-md text-lp-on-surface-variant">
                    Eligen día y horario libre, abonan la seña al instante y reciben la confirmación
                    por WhatsApp sin que muevas un solo dedo.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* NATIVE INTEGRATIONS STRIP */}
          <section className="py-lp-space-lg bg-lp-surface-container-lowest w-full">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <p className="text-lp-label-sm text-lp-on-surface-variant mb-lp-space-md text-center font-bold tracking-wider uppercase">
                Se conecta nativamente con las herramientas que ya usás a diario
              </p>
              <div className="gap-lp-space-lg flex flex-wrap items-center justify-center opacity-85">
                <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 px-4 py-2">
                  <span className="material-symbols-outlined text-lp-primary text-[22px]">
                    payments
                  </span>
                  <span className="text-lp-label-md text-lp-on-surface font-bold">
                    Mercado Pago
                  </span>
                </div>
                <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 px-4 py-2">
                  <span className="material-symbols-outlined text-[22px] text-emerald-600">
                    chat
                  </span>
                  <span className="text-lp-label-md text-lp-on-surface font-bold">
                    WhatsApp Business API
                  </span>
                </div>
                <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 px-4 py-2">
                  <span className="material-symbols-outlined text-[22px] text-rose-500">
                    photo_camera
                  </span>
                  <span className="text-lp-label-md text-lp-on-surface font-bold">
                    Instagram Book Button
                  </span>
                </div>
                <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 px-4 py-2">
                  <span className="material-symbols-outlined text-[22px] text-amber-500">
                    event_repeat
                  </span>
                  <span className="text-lp-label-md text-lp-on-surface font-bold">
                    Google Calendar Sync
                  </span>
                </div>
                <div className="bg-lp-surface-container-low rounded-lp-xl flex items-center gap-2 px-4 py-2">
                  <span className="material-symbols-outlined text-[22px] text-blue-600">
                    receipt_long
                  </span>
                  <span className="text-lp-label-md text-lp-on-surface font-bold">
                    Facturación AFIP / Electrónica
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* PRICING CARDS PREVIEW */}
          <section className="py-lp-space-xl bg-lp-surface w-full">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <div className="mb-lp-space-xl mx-auto max-w-2xl text-center">
                <span className="text-lp-label-sm text-lp-primary font-bold tracking-wider uppercase">
                  Precios claros y en moneda local
                </span>
                <h2 className="text-lp-headline-lg text-lp-on-surface mt-1 tracking-tight">
                  Planes diseñados para cada etapa de tu negocio
                </h2>
                <p className="text-lp-body-md text-lp-on-surface-variant mt-2">
                  Sin letra chica ni costos ocultos por reserva concretada.
                </p>
              </div>
              <div className="gap-lp-gutter grid grid-cols-1 items-stretch md:grid-cols-3">
                {/* Plan 1: Inicial */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-lp-label-sm text-lp-on-surface-variant font-bold uppercase">
                      Para empezar hoy
                    </span>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mt-1 font-extrabold">
                      Plan Inicial
                    </h3>
                    <div className="my-lp-space-md">
                      <span className="text-lp-headline-xl text-lp-on-surface font-black">$0</span>
                      <span className="text-lp-body-sm text-lp-on-surface-variant">
                        / gratis para siempre
                      </span>
                    </div>
                    <ul className="space-y-lp-space-sm text-lp-body-sm text-lp-on-surface mb-lp-space-lg">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>1 Profesional independiente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Hasta 50 turnos al mes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Link personalizado de reservas</span>
                      </li>
                      <li className="text-lp-outline flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span>Cobro automático de señas</span>
                      </li>
                      <li className="text-lp-outline flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span>WhatsApp Bot Oficial</span>
                      </li>
                    </ul>
                  </div>
                  <button className="bg-lp-surface-container-high hover:bg-lp-surface-container-highest text-lp-on-surface rounded-lp-lg text-lp-label-lg w-full py-3 font-bold transition-colors">
                    Crear cuenta gratis
                  </button>
                </div>
                {/* Plan 2: Pro (Destacado) */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg border-lp-primary relative flex flex-col justify-between border-2 shadow-xl">
                  <div className="bg-lp-primary text-lp-on-primary text-lp-label-sm absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-bold tracking-wider uppercase shadow-md">
                    Más elegido por Salones
                  </div>
                  <div>
                    <span className="text-lp-label-sm text-lp-primary font-bold uppercase">
                      El favorito del rubro
                    </span>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mt-1 font-extrabold">
                      CitaFlow PRO
                    </h3>
                    <div className="my-lp-space-md">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lp-headline-xl text-lp-on-surface font-black">
                          $18.500
                        </span>
                        <span className="text-lp-label-md text-lp-on-surface-variant font-bold">
                          ARS /mes
                        </span>
                      </div>
                      <span className="text-lp-label-sm text-lp-secondary font-bold">
                        Prueba 14 días sin costo
                      </span>
                    </div>
                    <ul className="space-y-lp-space-sm text-lp-body-sm text-lp-on-surface mb-lp-space-lg">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span className="font-bold">Profesionales ilimitados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Turnos y reservas sin límite</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span className="text-lp-primary font-bold">
                          Cobro de señas vía Mercado Pago
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span className="text-lp-primary font-bold">
                          Recordatorios WhatsApp IA 24h & 2h
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Fichas técnicas y de clientes</span>
                      </li>
                    </ul>
                  </div>
                  <button className="bg-lp-primary hover:bg-lp-primary-container text-lp-on-primary rounded-lp-lg text-lp-label-lg w-full py-3.5 font-bold shadow-lg transition-all">
                    Probar PRO gratis 14 días
                  </button>
                </div>
                {/* Plan 3: Multi-Sucursal */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-lp-label-sm text-lp-on-surface-variant font-bold uppercase">
                      Franquicias & Redes
                    </span>
                    <h3 className="text-lp-headline-sm text-lp-on-surface mt-1 font-extrabold">
                      Multi-Sucursal
                    </h3>
                    <div className="my-lp-space-md">
                      <span className="text-lp-headline-xl text-lp-on-surface font-black">
                        A medida
                      </span>
                      <span className="text-lp-body-sm text-lp-on-surface-variant block">
                        Consolidado corporativo
                      </span>
                    </div>
                    <ul className="space-y-lp-space-sm text-lp-body-sm text-lp-on-surface mb-lp-space-lg">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Gestión centralizada de sucursales</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Acceso por roles y permisos de caja</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>API de integración e informes contables</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                          check_circle
                        </span>
                        <span>Gerente de cuenta dedicado</span>
                      </li>
                    </ul>
                  </div>
                  <button className="bg-lp-surface-container-high hover:bg-lp-surface-container-highest text-lp-on-surface rounded-lp-lg text-lp-label-lg w-full py-3 font-bold transition-colors">
                    Contactar a Ventas
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* TESTIMONIALS SECTION */}
          <section className="py-lp-space-xl bg-lp-surface-container-low w-full">
            <div className="px-lp-margin mx-auto max-w-[1240px]">
              <div className="mb-lp-space-xl mx-auto max-w-2xl text-center">
                <span className="text-lp-label-sm text-lp-primary font-bold tracking-wider uppercase">
                  Casos Reales
                </span>
                <h2 className="text-lp-headline-lg text-lp-on-surface mt-1 tracking-tight">
                  Lo que dicen los dueños de salones y clínicas
                </h2>
                <p className="text-lp-body-md text-lp-on-surface-variant mt-2">
                  Testimonios de profesionales que recuperaron sus fines de semana gracias a la
                  automatización.
                </p>
              </div>
              <div className="gap-lp-gutter grid grid-cols-1 md:grid-cols-3">
                {/* Testimonial 1 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="mb-lp-space-sm flex text-amber-500">
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                    </div>
                    <p className="text-lp-body-md text-lp-on-surface mb-lp-space-md italic">
                      “Antes pasaba 3 horas por noche contestando mensajes de WhatsApp para
                      coordinar turnos del día siguiente. Con CitaFlow y la seña de MercadoPago,
                      pasamos de tener 4 ausencias diarias a literalmente cero.”
                    </p>
                  </div>
                  <div className="gap-lp-space-sm pt-lp-space-sm bg-lp-surface-container-low/40 -mx-lp-space-lg -mb-lp-space-lg p-lp-space-md rounded-b-lp-2xl flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover shadow-xs"
                      alt="Portrait photograph of Andrea Carballo, female salon owner with stylish blonde hair and black professional attire in a modern beauty studio in Palermo Buenos Aires, natural soft lighting"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC75g9CY_sVe32rBW0NIZemc0jt_FMXL3otKMGc9vRbl_Ym-QYKjWTtCJICxfgie3rdcCAEh33hqOPrY2Elq0Dl84-VPVOgO4v9GUMaQpvegACMiuVsiIf_XK1RE1nqb32KJvQCO7-HCj3xhiSvoKhAsBqe4xM5FeNzuRDCGoZIREj3ayp6sxl6Yt2VHL1HQAxQr4OGcs5wXlPvHkWH3mjj0M71OcGviQqh0kZ7v2enprLIduP38xSx-g"
                    />
                    <div>
                      <span className="text-lp-title-sm text-lp-on-surface block font-bold">
                        Andrea Carballo
                      </span>
                      <span className="text-lp-body-sm text-lp-on-surface-variant">
                        Dueña de TopHair Studio · Palermo
                      </span>
                    </div>
                  </div>
                </div>
                {/* Testimonial 2 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="mb-lp-space-sm flex text-amber-500">
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                    </div>
                    <p className="text-lp-body-md text-lp-on-surface mb-lp-space-md italic">
                      “Manejo 6 sillones de barbería y era un caos de papeles y turnos superpuestos.
                      El bot de WhatsApp les avisa 2 horas antes y el cliente confirma solo.
                      Aumentamos un 30% la facturación el primer mes.”
                    </p>
                  </div>
                  <div className="gap-lp-space-sm pt-lp-space-sm bg-lp-surface-container-low/40 -mx-lp-space-lg -mb-lp-space-lg p-lp-space-md rounded-b-lp-2xl flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover shadow-xs"
                      alt="Portrait photograph of Lucas Benítez, male barber shop owner with trimmed beard, wearing leather apron in a warm wood and industrial brick barber shop in Córdoba Argentina"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkzIKYyp4RhCVRJ47JYJApBrO96J4gSPFxj_7pXBH6Ppi4YLPuf9JNzBwlyWVT2KrSDF0SvHQrBm4lhawGb_B-qc_RSsovg7UT5hluhIbZ4p2htfYahRPHErQjkZ0Nz-QLtHpy-NeWL28syrs9CF8CcrpNzny0Ly6Cr45oKlDfqYjVLJ3nJtihYWAFwfSwqbi7-Hyz-iUiXm6s6g3XBRhK4diBFSgLfswFTEj32WszPDFthIoHjwZLkg"
                    />
                    <div>
                      <span className="text-lp-title-sm text-lp-on-surface block font-bold">
                        Lucas Benítez
                      </span>
                      <span className="text-lp-body-sm text-lp-on-surface-variant">
                        Fundador de BarberClub · Córdoba
                      </span>
                    </div>
                  </div>
                </div>
                {/* Testimonial 3 */}
                <div className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="mb-lp-space-sm flex text-amber-500">
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={FILL}>
                        star
                      </span>
                    </div>
                    <p className="text-lp-body-md text-lp-on-surface mb-lp-space-md italic">
                      “En medicina estética un turno perdido son equipos caros apagados. Cobrar la
                      consulta con seña previa filtró totalmente a los curiosos. Ahora la agenda
                      está completa con pacientes 100% comprometidos.”
                    </p>
                  </div>
                  <div className="gap-lp-space-sm pt-lp-space-sm bg-lp-surface-container-low/40 -mx-lp-space-lg -mb-lp-space-lg p-lp-space-md rounded-b-lp-2xl flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover shadow-xs"
                      alt="Portrait of Dr. Silvina Ramos, confident female aesthetic physician in white medical coat smiling warmly in an elegant clinical consultation room in Rosario Argentina"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6fXEBUhUnko3f-cfnnnTabmXKrtKtUTWUS9znQJG_eDIvZb_-lxt_vFgA-QWNHrdHMnW9_OID25CAVWZjrXMc2upsKltRPQFPfFdBBhzCJQqpBLy9LZvvpfunGJq5JLKTkPG4hd-xaymwmEQ4E1bBPkOdFmn9x0nBi7B2bPFQFwGapCdngF_15L2I6SD8E9uHFOmi7HXdTIseAXyBrgZK1HnPt9-gP-2uMvvqtfKmNgr0bAsPDHp8HQ"
                    />
                    <div>
                      <span className="text-lp-title-sm text-lp-on-surface block font-bold">
                        Dra. Silvina Ramos
                      </span>
                      <span className="text-lp-body-sm text-lp-on-surface-variant">
                        Directora Clínica DermaArt · Rosario
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* FINAL CONVERSION CTA */}
          <section className="py-lp-space-xl from-lp-primary to-lp-primary-container text-lp-on-primary relative w-full overflow-hidden bg-linear-to-br/srgb">
            {/* Atmospheric shapes */}
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="bg-lp-secondary/20 pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full blur-2xl"></div>
            <div className="px-lp-margin relative mx-auto max-w-4xl text-center">
              <span className="text-lp-on-primary text-lp-label-sm mb-lp-space-md inline-block rounded-full bg-white/20 px-3 py-1 font-bold tracking-wider uppercase">
                Comenzá hoy en 2 minutos
              </span>
              <h2 className="text-lp-headline-xl mb-lp-space-md font-black tracking-tight">
                Sumate a los miles de negocios que ya no pierden tiempo con mensajes manuales
              </h2>
              <p className="text-lp-body-lg text-lp-primary-fixed mb-lp-space-lg mx-auto max-w-xl">
                Activá tu enlace exclusivo, configurá tu WhatsApp bot y cobrá señas seguras con
                MercadoPago desde el primer día.
              </p>
              <div className="gap-lp-space-md flex flex-col items-center justify-center sm:flex-row">
                <Link
                  className="gap-lp-space-xs text-lp-label-lg text-lp-primary bg-lp-surface-container-lowest px-lp-space-xl rounded-lp-lg hover:bg-lp-surface-container-low inline-flex w-full items-center justify-center py-4 shadow-2xl transition-all active:scale-[0.98] sm:w-auto"
                  href={ALTA}
                >
                  <span>Crear mi agenda gratis ahora</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
              <div className="gap-lp-space-md mt-lp-space-lg text-lp-primary-fixed text-lp-label-sm flex flex-wrap items-center justify-center">
                <span>✓ 14 días de prueba gratis</span>
                <span>•</span>
                <span>✓ Sin ingresar datos de tarjeta</span>
                <span>•</span>
                <span>✓ Soporte en español por WhatsApp</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="bg-lp-surface-container-lowest pt-lp-space-xl pb-lp-space-lg w-full shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
        <div className="px-lp-margin mx-auto max-w-[1240px]">
          <div className="gap-lp-gutter mb-lp-space-xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div className="gap-lp-space-md col-span-2 flex flex-col md:col-span-3 lg:col-span-1">
              <div className="flex items-center">
                <PlatformLogo size={26} />
              </div>
              <p className="text-lp-body-sm text-lp-on-surface-variant max-w-xs">
                La plataforma líder de reservas en línea, pagos de señas automáticas y recordatorios
                WhatsApp para profesionales y franquicias en Latinoamérica.
              </p>
              <div className="gap-lp-space-sm text-lp-on-surface-variant flex items-center">
                <span className="material-symbols-outlined hover:text-lp-primary cursor-pointer text-[20px] transition-colors">
                  public
                </span>
                <span className="material-symbols-outlined hover:text-lp-primary cursor-pointer text-[20px] transition-colors">
                  chat
                </span>
                <span className="material-symbols-outlined hover:text-lp-primary cursor-pointer text-[20px] transition-colors">
                  mail
                </span>
              </div>
            </div>
            <div className="gap-lp-space-sm flex flex-col">
              <span className="text-lp-title-sm text-lp-on-surface">Producto</span>
              <nav className="gap-lp-space-xs flex flex-col">
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Agenda Inteligente
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Cobro de Señas
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  WhatsApp Bot Oficial
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Planes y Tarifas
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Mercado Pago Checkout
                </a>
              </nav>
            </div>
            <div className="gap-lp-space-sm flex flex-col">
              <span className="text-lp-title-sm text-lp-on-surface">Rubros</span>
              <nav className="gap-lp-space-xs flex flex-col">
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Salones y Peluquerías
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Estética y Spas
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Consultorios y Salud
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Barberías y Grooming
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Entrenamiento y Clases
                </a>
              </nav>
            </div>
            <div className="gap-lp-space-sm flex flex-col">
              <span className="text-lp-title-sm text-lp-on-surface">Recursos</span>
              <nav className="gap-lp-space-xs flex flex-col">
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Casos de Éxito
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Calculadora de No-Shows
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  API para Desarrolladores
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Centro de Ayuda
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Comunidad Pro
                </a>
              </nav>
            </div>
            <div className="gap-lp-space-sm flex flex-col">
              <span className="text-lp-title-sm text-lp-on-surface">Empresa</span>
              <nav className="gap-lp-space-xs flex flex-col">
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Sobre Nosotros
                </a>
                <a
                  className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                  href="#"
                >
                  Programa de Afiliados
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Privacidad y Términos
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Seguridad y Datos
                </a>
                <a className="text-lp-primary font-bold transition-colors" href="#">
                  Contacto Comercial
                </a>
              </nav>
            </div>
          </div>
          <div className="bg-lp-surface-container-low rounded-lp-xl p-lp-space-md mb-lp-space-lg gap-lp-space-md flex flex-wrap items-center justify-between">
            <div className="gap-lp-space-sm flex items-center">
              <span className="material-symbols-outlined text-lp-secondary text-[24px]">
                verified_user
              </span>
              <span className="text-lp-body-sm text-lp-on-surface">
                Infraestructura segura, respaldos continuos y cumplimiento de normativas de
                privacidad.
              </span>
            </div>
            <div className="gap-lp-space-md flex flex-wrap items-center">
              <div className="gap-lp-space-xs px-lp-space-sm py-lp-space-xs bg-lp-surface-container-lowest inline-flex items-center rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <span className="material-symbols-outlined text-lp-secondary text-[16px]">
                  lock
                </span>
                <span className="text-lp-label-sm text-lp-on-surface">SSL 256-bit Encriptado</span>
              </div>
              <div className="gap-lp-space-xs px-lp-space-sm py-lp-space-xs bg-lp-surface-container-lowest inline-flex items-center rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <span className="material-symbols-outlined text-lp-primary text-[16px]">
                  payments
                </span>
                <span className="text-lp-label-sm text-lp-on-surface">MercadoPago Partner</span>
              </div>
              <div className="gap-lp-space-xs px-lp-space-sm py-lp-space-xs bg-lp-surface-container-lowest inline-flex items-center rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <span className="material-symbols-outlined text-lp-secondary text-[16px]">
                  forum
                </span>
                <span className="text-lp-label-sm text-lp-on-surface">WhatsApp Business API</span>
              </div>
            </div>
          </div>
          <div className="gap-lp-space-sm pt-lp-space-md flex flex-col items-center justify-between sm:flex-row">
            <p className="text-lp-body-sm text-lp-on-surface-variant">
              © 2025 CitaFlow Technologies Ltd. Diseñado para simplificar reservas en Argentina y
              América Latina.
            </p>
            <div className="gap-lp-space-md flex items-center">
              <Link
                className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="/terminos"
              >
                Términos del Servicio
              </Link>
              <Link
                className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="/privacidad"
              >
                Política de Privacidad
              </Link>
              <a
                className="text-lp-body-sm text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
                href="#"
              >
                Estado del Sistema
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
