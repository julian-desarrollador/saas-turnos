"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { LegalLinks } from "@/app/legal-links";
import {
  publicTheme as t,
  whatsappHref,
  type PublicAccent,
} from "@/components/shared/public-template";
import { cn } from "@/lib/utils";
import { forgetDeviceAction } from "@/modules/booking/adapters/inbound/device-actions";

import { clearGuestProfile, useGuestProfile, writeGuestProfile } from "./guest-profile";

export function PublicProfileScreen({
  slug,
  businessName,
  accent,
  phone,
  address,
  instagram,
}: {
  slug: string;
  businessName: string;
  accent: PublicAccent;
  phone: string | null;
  address: string | null;
  instagram: string | null;
}) {
  const router = useRouter();
  const guest = useGuestProfile(slug);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstName = nameDraft ?? guest.firstName;
  const guestPhone = phoneDraft ?? guest.phone;
  const whatsapp = whatsappHref(phone);

  return (
    <div className="grid gap-10 px-6 py-10">
      <header>
        <p className={cn(t.eyebrow, accent.text)}>{businessName}</p>
        <h1 className={cn("mt-2 text-4xl", t.display)}>
          {firstName ? `Hola, ${firstName}` : "Perfil"}
        </h1>
      </header>

      <a
        href={`/${slug}/perfil/turnos`}
        className={cn("flex items-center justify-between border-y py-5", t.line)}
      >
        <span>
          <span className={cn("block text-xl", t.display)}>Mis turnos</span>
          <span className={cn("block text-xs", t.muted)}>Ver, cambiar o cancelar</span>
        </span>
        <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
      </a>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          writeGuestProfile(slug, { firstName, phone: guestPhone });
          setSaved(true);
        }}
      >
        <div>
          <p className={cn(t.eyebrow, accent.text)}>Mis datos</p>
          <p className={cn("mt-2 text-sm leading-relaxed", t.muted)}>
            Quedan en este celular para la próxima reserva. No abren los turnos de otra persona.
          </p>
        </div>
        <label className={t.label}>
          Nombre
          <input
            value={firstName}
            autoComplete="given-name"
            onChange={(event) => {
              setNameDraft(event.target.value);
              setSaved(false);
            }}
            className={t.input}
          />
        </label>
        <label className={t.label}>
          Teléfono
          <input
            value={guestPhone}
            inputMode="tel"
            autoComplete="tel"
            onChange={(event) => {
              setPhoneDraft(event.target.value);
              setSaved(false);
            }}
            className={t.input}
          />
        </label>
        <button type="submit" disabled={pending} className={t.primary}>
          Guardar en este celular
        </button>
        {saved ? <p className={cn("text-sm", t.muted)}>Guardado en este celular.</p> : null}
      </form>

      {address || whatsapp || instagram ? (
        <section className="grid gap-3">
          <p className={cn(t.eyebrow, accent.text)}>Contacto</p>
          {address ? <p className={cn("text-xl leading-snug", t.display)}>{address}</p> : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className={t.secondary}>
              Escribir por WhatsApp
            </a>
          ) : null}
          {instagram ? (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className={cn("text-sm", t.muted)}
            >
              @{instagram}
            </a>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        disabled={pending}
        className={cn("justify-self-start", t.link, t.muted)}
        onClick={() => {
          startTransition(async () => {
            clearGuestProfile(slug);
            setNameDraft("");
            setPhoneDraft("");
            setSaved(false);
            await forgetDeviceAction(slug);
            router.refresh();
          });
        }}
      >
        Olvidar este celular
      </button>
      <LegalLinks className={t.muted} />
    </div>
  );
}
