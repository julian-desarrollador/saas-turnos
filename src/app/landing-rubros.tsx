"use client";

import { useState, type ReactNode } from "react";

/* Selector de rubros de la portada (diseño de Stitch, docs/22-marketing.md §12). Datos de ejemplo. */

const RUBROS = {
  peluqueria: {
    name: "Aster Hair & Color Studio",
    location: "Palermo Soho, Ciudad Autónoma de Buenos Aires",
    link: "aster.citaflow.pro",
    avatar: "✂️",
    serv1: {
      title: "Balayage Signature & Nutrición Kérastase",
      desc: "Diagnóstico de colorimetría, decoloración cuidada, tonalizado y nutrición intensiva.",
      time: "150 minutos",
      deposit: "Seña anticipada: $15.000",
      price: "$45.000 ARS",
    },
    serv2: {
      title: "Corte de Autor & Lavado Masajeado",
      desc: "Diseño morfológico según facciones, secado modelado y producto de finalización.",
      time: "45 minutos",
      deposit: "Seña anticipada: $5.000",
      price: "$18.000 ARS",
    },
  },
  barberia: {
    name: "The Classic Barber & Co.",
    location: "Nueva Córdoba, Córdoba Capital",
    link: "classicbarber.citaflow.pro",
    avatar: "",
    serv1: {
      title: "Corte Degradé + Ritual de Barba con Toalla Caliente",
      desc: "Corte a tijera o máquina, afeitado tradicional con navaja y aceites esenciales.",
      time: "50 minutos",
      deposit: "Seña anticipada: $4.000",
      price: "$12.500 ARS",
    },
    serv2: {
      title: "Perfilado de Barba & Tónico Revitalizante",
      desc: "Delineado prolijo de líneas de mejilla y cuello con espuma térmica.",
      time: "25 minutos",
      deposit: "Seña anticipada: $2.500",
      price: "$7.500 ARS",
    },
  },
  estetica: {
    name: "Lumina Estética Facial Avanzada",
    location: "Recoleta, Buenos Aires",
    link: "luminaestetica.citaflow.pro",
    avatar: "✨",
    serv1: {
      title: "Limpieza Profunda con Punta de Diamante y Altafrecuencia",
      desc: "Extracción desinfectada, microdermoabrasión, máscara descongestiva e hidratación.",
      time: "60 minutos",
      deposit: "Seña anticipada: $8.000",
      price: "$24.000 ARS",
    },
    serv2: {
      title: "Sesión Peeling Renovador Iluminador",
      desc: "Ácidos combinados para textura, manchas solares y líneas finas.",
      time: "45 minutos",
      deposit: "Seña anticipada: $10.000",
      price: "$30.000 ARS",
    },
  },
  spa: {
    name: "Ananda Masajes & Circuito Relajante",
    location: "Mendoza Capital",
    link: "anandaspa.citaflow.pro",
    avatar: "‍♀️",
    serv1: {
      title: "Masaje Descontracturante Profundo con Piedras Calientes",
      desc: "Alivio integral de tensiones dorsales y cervicales con aromaterapia orgánica.",
      time: "60 minutos",
      deposit: "Seña anticipada: $7.000",
      price: "$22.000 ARS",
    },
    serv2: {
      title: "Drenaje Linfático Manual Completo",
      desc: "Técnica suave especializada para favorecer retorno circulatorio y desinflamación.",
      time: "50 minutos",
      deposit: "Seña anticipada: $6.000",
      price: "$19.000 ARS",
    },
  },
  salud: {
    name: "Centro Médico & Psicología Integral",
    location: "Rosario, Santa Fe",
    link: "saludintegral.citaflow.pro",
    avatar: "",
    serv1: {
      title: "Consulta Médica General / Orientación Diagnóstica",
      desc: "Evaluación clínica completa, solicitud y lectura de estudios de laboratorio.",
      time: "30 minutos",
      deposit: "Seña anticipada: $6.000",
      price: "$18.000 ARS",
    },
    serv2: {
      title: "Sesión de Terapia Psicológica Individual (Presencial/Online)",
      desc: "Espacio terapéutico confidencial con profesional colegiado.",
      time: "45 minutos",
      deposit: "Seña anticipada: $5.000",
      price: "$16.000 ARS",
    },
  },
  unas: {
    name: "Velvet Nails & Lash Design",
    location: "Belgrano, Buenos Aires",
    link: "velvetnails.citaflow.pro",
    avatar: "",
    serv1: {
      title: "Kapping Gel + Esmaltado Semipermanente con Nail Art",
      desc: "Fortalecimiento sobre uña natural, nivelación rusa y diseño a mano alzada.",
      time: "90 minutos",
      deposit: "Seña anticipada: $6.000",
      price: "$19.500 ARS",
    },
    serv2: {
      title: "Lifting de Pestañas + Tinte Negro Intenso",
      desc: "Curvatura duradera y nutrición con keratina botulínica de 6 a 8 semanas.",
      time: "60 minutos",
      deposit: "Seña anticipada: $4.500",
      price: "$14.000 ARS",
    },
  },
} as const;

type Rubro = keyof typeof RUBROS;

const CHIPS: { key: Rubro; icon: string; label: string }[] = [
  {
    key: "peluqueria",
    icon: "✂️",
    label: "Peluquerías & Salones",
  },
  {
    key: "barberia",
    icon: "",
    label: "Barberías",
  },
  {
    key: "estetica",
    icon: "✨",
    label: "Estética & Cosmiatría",
  },
  {
    key: "spa",
    icon: "‍♀️",
    label: "Spas & Masajes",
  },
  {
    key: "salud",
    icon: "",
    label: "Consultorios & Salud",
  },
  {
    key: "unas",
    icon: "",
    label: "Uñas & Pestañas",
  },
];

const PREVIEW_ID = "preview-panel";

export function LandingRubros() {
  const [rubro, setRubro] = useState<Rubro>("peluqueria");
  // Como en Stitch: antes del primer clic el avatar muestra "P".
  const [touched, setTouched] = useState(false);
  const data = RUBROS[rubro];

  return (
    <>
      {/* SECTOR SELECTOR (INTERACTIVE DEMO) */}
      <section className="py-lp-space-xl bg-lp-surface w-full">
        <div className="px-lp-margin mx-auto max-w-[1240px]">
          <div className="mb-lp-space-lg mx-auto max-w-2xl text-center">
            <span className="text-lp-label-sm text-lp-primary font-bold tracking-wider uppercase">
              Personalizado a tu medida
            </span>
            <h2 className="text-lp-headline-lg text-lp-on-surface mt-1 tracking-tight">
              Especializado para la medida exacta de tu negocio
            </h2>
            <p className="text-lp-body-md text-lp-on-surface-variant mt-2">
              Cada rubro tiene tiempos, señas y dinámicas distintas. Elegí tu sector y mirá cómo
              reservarían tus clientes desde tu enlace único.
            </p>
          </div>
          {/* Segmented Chips Selector */}
          <div className="gap-lp-space-xs mb-lp-space-lg flex flex-wrap items-center justify-center">
            {CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setRubro(chip.key);
                  setTouched(true);
                }}
                className={`text-lp-label-lg inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-all ${chip.key === rubro ? "bg-lp-primary text-lp-on-primary shadow-md" : "bg-lp-surface-container-lowest text-lp-on-surface hover:bg-lp-surface-container-high"}`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
          {/* Dynamic Interactive Preview Card */}
          <div
            className="bg-lp-surface-container-lowest rounded-lp-2xl p-lp-space-lg mx-auto max-w-3xl shadow-xl"
            id={PREVIEW_ID}
          >
            <div className="pb-lp-space-md mb-lp-space-md bg-lp-surface-container-low/50 -mx-lp-space-lg -mt-lp-space-lg p-lp-space-md rounded-t-lp-2xl flex items-center justify-between">
              <div className="gap-lp-space-sm flex items-center">
                <div className="bg-lp-primary-fixed text-lp-primary flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold">
                  {touched ? data.avatar : "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lp-title-sm text-lp-on-surface font-bold">{data.name}</h3>
                    <span className="text-lp-label-sm text-lp-secondary bg-lp-secondary-fixed/50 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
                      Verificado
                    </span>
                  </div>
                  <p className="text-lp-body-sm text-lp-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-lp-outline text-[16px]">
                      location_on
                    </span>
                    <span>{data.location}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lp-label-sm text-lp-on-surface-variant block">
                  Link directo
                </span>
                <span className="text-lp-label-md text-lp-primary font-semibold">{data.link}</span>
              </div>
            </div>
            <div className="space-y-lp-space-md" id="preview-services-list">
              {/* Dynamic Service Item 1 */}
              <div className="p-lp-space-md rounded-lp-xl bg-lp-surface-container-low hover:bg-lp-surface-container flex items-center justify-between transition-colors">
                <div className="flex flex-col">
                  <span className="text-lp-title-sm text-lp-on-surface font-bold">
                    {data.serv1.title}
                  </span>
                  <span className="text-lp-body-sm text-lp-on-surface-variant">
                    {data.serv1.desc}
                  </span>
                  <div className="gap-lp-space-md mt-2 flex items-center">
                    <span className="text-lp-label-sm text-lp-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span>{data.serv1.time}</span>
                    </span>
                    <span className="text-lp-label-sm text-lp-secondary flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                      <span>{data.serv1.deposit}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lp-headline-sm text-lp-on-surface font-extrabold">
                    {data.serv1.price}
                  </span>
                  <button className="bg-lp-primary text-lp-on-primary rounded-lp-lg text-lp-label-md hover:bg-lp-primary-container px-4 py-2 font-semibold transition-all">
                    Reservar turno
                  </button>
                </div>
              </div>
              {/* Dynamic Service Item 2 */}
              <div className="p-lp-space-md rounded-lp-xl bg-lp-surface-container-low hover:bg-lp-surface-container flex items-center justify-between transition-colors">
                <div className="flex flex-col">
                  <span className="text-lp-title-sm text-lp-on-surface font-bold">
                    {data.serv2.title}
                  </span>
                  <span className="text-lp-body-sm text-lp-on-surface-variant">
                    {data.serv2.desc}
                  </span>
                  <div className="gap-lp-space-md mt-2 flex items-center">
                    <span className="text-lp-label-sm text-lp-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span>{data.serv2.time}</span>
                    </span>
                    <span className="text-lp-label-sm text-lp-secondary flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                      <span>{data.serv2.deposit}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lp-headline-sm text-lp-on-surface font-extrabold">
                    {data.serv2.price}
                  </span>
                  <button className="bg-lp-primary text-lp-on-primary rounded-lp-lg text-lp-label-md hover:bg-lp-primary-container px-4 py-2 font-semibold transition-all">
                    Reservar turno
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-lp-space-md pt-lp-space-md gap-lp-space-md flex flex-wrap items-center justify-between">
              <div className="text-lp-on-surface-variant flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-lp-secondary text-[18px]">
                  verified
                </span>
                <span>Cobro procesado al instante por MercadoPago oficial</span>
              </div>
              <a
                className="text-lp-label-md text-lp-primary flex items-center gap-1 font-bold hover:underline"
                href="#"
              >
                <span>Crear un catálogo similar para mi negocio</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function DemoScrollButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        document.getElementById(PREVIEW_ID)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    >
      {children}
    </button>
  );
}
