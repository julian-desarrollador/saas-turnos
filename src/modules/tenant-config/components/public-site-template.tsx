import Image from "next/image";

import { cn } from "@/lib/utils";
import {
  formatDuration,
  initialOf,
  pesos,
  publicName,
  publicTheme as t,
  whatsappHref,
  type PublicAccent,
} from "@/components/shared/public-template";

import { WEEKDAYS } from "./schedule-view";

export type PublicSiteContent = {
  name: string;
  headline: string;
  about: string;
  instagram: string | null;
  phone: string | null;
  address: string | null;
  hours: { dayOfWeek: number; startTime: string; endTime: string }[];
  services: { name: string; durationMinutes: number; priceAmount: number }[];
  images: { logo: string | null; cover: string | null; gallery: string[] };
  showReserve: boolean;
};

const COVER_SIZES = "(max-width: 448px) 100vw, 448px";

export function PublicCover({
  name,
  headline,
  logo,
  cover,
}: {
  name: string;
  headline: string;
  logo: string | null;
  cover: string | null;
}) {
  return (
    <header
      className={cn(
        "relative flex flex-col justify-end overflow-hidden",
        cover ? "h-[470px]" : "h-80",
        t.dark,
      )}
    >
      {cover ? (
        <>
          <Image src={cover} alt="" fill priority sizes={COVER_SIZES} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </>
      ) : null}
      <div className="relative grid gap-4 px-6 pb-10">
        {logo ? (
          <span className="relative block size-16 overflow-hidden rounded-full border border-white/40 bg-white">
            <Image src={logo} alt={`Logo de ${name}`} fill sizes="64px" className="object-cover" />
          </span>
        ) : (
          <span
            aria-hidden
            className={cn(
              "flex size-16 items-center justify-center rounded-full border border-white/40 text-3xl",
              t.display,
            )}
          >
            {initialOf(name)}
          </span>
        )}
        <h1 className={cn("text-[40px] leading-[1.05] font-medium text-white", t.display)}>
          {name}
        </h1>
        {headline ? (
          <p className="max-w-[32ch] text-sm leading-relaxed text-white/80">{headline}</p>
        ) : null}
      </div>
    </header>
  );
}

function Eyebrow({ accent, children }: { accent: PublicAccent; children: React.ReactNode }) {
  return <p className={cn(t.eyebrow, accent.text)}>{children}</p>;
}

export function PublicSiteTemplate({
  slug,
  accent,
  content,
}: {
  slug: string;
  accent: PublicAccent;
  content: PublicSiteContent;
}) {
  const whatsapp = whatsappHref(content.phone);
  const maps = content.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address)}`
    : null;
  const [feature, ...rest] = content.images.gallery;

  return (
    <div className={t.page}>
      <PublicCover
        name={content.name}
        headline={content.headline}
        logo={content.images.logo}
        cover={content.images.cover}
      />

      <div className="grid gap-3 px-6 py-8">
        {content.showReserve ? (
          <a href={`/${slug}/reservar`} className={t.primary}>
            Reservar turno
          </a>
        ) : (
          <p className={cn("text-sm", t.muted)}>Este negocio no está recibiendo reservas online.</p>
        )}
        <a href={`/${slug}/servicios`} className={t.secondary}>
          Ver servicios
        </a>
      </div>

      {content.services.length > 0 ? (
        <section className={cn("border-t px-6 py-8", t.line)}>
          <Eyebrow accent={accent}>Servicios</Eyebrow>
          <ul className="mt-4">
            {content.services.slice(0, 3).map((service) => (
              <li
                key={service.name}
                className={cn("flex items-baseline justify-between gap-4 border-b py-4", t.line)}
              >
                <span>
                  <span className={cn("block text-lg", t.display)}>{publicName(service.name)}</span>
                  <span className={cn("block text-xs", t.muted)}>
                    {formatDuration(service.durationMinutes)}
                  </span>
                </span>
                <span className="text-sm font-medium">{pesos.format(service.priceAmount)}</span>
              </li>
            ))}
          </ul>
          {content.services.length > 3 ? (
            <a href={`/${slug}/servicios`} className={cn("mt-5 inline-block", t.link)}>
              Ver los {content.services.length} servicios
            </a>
          ) : null}
        </section>
      ) : null}

      {feature ? (
        <section className={cn("border-t px-6 py-8", t.line)}>
          <Eyebrow accent={accent}>El lugar</Eyebrow>
          <div className="mt-4 grid h-72 grid-cols-[2fr_1fr] grid-rows-2 gap-1">
            <GalleryPhoto
              src={feature}
              name={content.name}
              className={rest.length > 0 ? "row-span-2" : "col-span-2 row-span-2"}
            />
            {rest.slice(0, 2).map((src) => (
              <GalleryPhoto key={src} src={src} name={content.name} />
            ))}
          </div>
          {rest.length > 2 ? (
            <div className="mt-1 grid grid-cols-3 gap-1">
              {rest.slice(2).map((src) => (
                <GalleryPhoto key={src} src={src} name={content.name} className="aspect-square" />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {content.about ? (
        <section className={cn("border-t px-6 py-8", t.line)}>
          <Eyebrow accent={accent}>Sobre nosotros</Eyebrow>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{content.about}</p>
        </section>
      ) : null}

      <section className={cn("grid gap-5 border-t px-6 py-8", t.line)}>
        <Eyebrow accent={accent}>Dónde estamos</Eyebrow>
        {maps ? (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className={cn("text-2xl leading-snug", t.display)}
          >
            {content.address}
          </a>
        ) : null}
        <ul className="grid text-sm">
          {WEEKDAYS.map((weekday) => {
            const bands = content.hours.filter((hour) => hour.dayOfWeek === weekday.day);
            return (
              <li
                key={weekday.day}
                className={cn("flex justify-between gap-3 border-b py-2", t.line)}
              >
                <span>{weekday.label}</span>
                <span className={bands.length === 0 ? t.muted : undefined}>
                  {bands.length === 0
                    ? "Cerrado"
                    : bands.map((band) => `${band.startTime}–${band.endTime}`).join(" · ")}
                </span>
              </li>
            );
          })}
        </ul>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" className={t.secondary}>
            Escribir por WhatsApp
          </a>
        ) : null}
        {content.instagram ? (
          <a
            href={`https://instagram.com/${content.instagram}`}
            target="_blank"
            rel="noreferrer"
            className={cn("text-sm", t.muted)}
          >
            @{content.instagram}
          </a>
        ) : null}
      </section>
    </div>
  );
}

function GalleryPhoto({ src, name, className }: { src: string; name: string; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-[#e7e0d5]", className)}>
      <Image
        src={src}
        alt={`Foto de ${name}`}
        fill
        sizes="(max-width: 448px) 66vw, 300px"
        className="object-cover"
      />
    </span>
  );
}
