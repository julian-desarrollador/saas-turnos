"use client";

import { useActionState, useState } from "react";

import { brandColors, type BrandColor } from "@/modules/tenant-config/application/ports/site-store";
import {
  saveSiteProfileAction,
  type SiteEditorData,
} from "@/modules/tenant-config/adapters/inbound/site-actions";

import { publicFonts } from "@/components/shared/public-fonts";

import { brandAccent } from "./brand-style";
import { PublicSiteTemplate } from "./public-site-template";
import { SiteImagesEditor } from "./site-images-editor";

const colorLabels: Record<BrandColor, string> = {
  slate: "Pizarra",
  rose: "Rosa",
  amber: "Ámbar",
  emerald: "Verde",
  sky: "Cielo",
  violet: "Violeta",
  stone: "Piedra",
  zinc: "Zinc",
};

const swatch: Record<BrandColor, string> = {
  slate: "bg-slate-800",
  rose: "bg-rose-700",
  amber: "bg-amber-700",
  emerald: "bg-emerald-800",
  sky: "bg-sky-800",
  violet: "bg-violet-800",
  stone: "bg-stone-700",
  zinc: "bg-zinc-800",
};

export function SiteEditorForm({ slug, editor }: { slug: string; editor: SiteEditorData }) {
  const [headline, setHeadline] = useState(editor.profile.headline);
  const [about, setAbout] = useState(editor.profile.about);
  const [brandColor, setBrandColor] = useState<BrandColor>(editor.profile.brandColor);
  const [instagram, setInstagram] = useState(editor.profile.instagram ?? "");
  const [published, setPublished] = useState(editor.profile.published);
  const [state, action, pending] = useActionState(
    saveSiteProfileAction.bind(null, slug),
    undefined,
  );

  return (
    <div className={`${publicFonts} mx-auto grid max-w-5xl gap-8 px-4 py-6 lg:grid-cols-2`}>
      <div className="grid content-start gap-6">
        <form action={action} className="grid gap-4">
          <h1 className="text-2xl font-semibold">Sitio</h1>
          <label className="grid gap-1 text-sm">
            Frase
            <input
              name="headline"
              value={headline}
              maxLength={120}
              onChange={(event) => setHeadline(event.target.value)}
              className="rounded-xl border px-3 py-2 text-base"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Sobre nosotros
            <textarea
              name="about"
              value={about}
              maxLength={1000}
              rows={5}
              onChange={(event) => setAbout(event.target.value)}
              className="rounded-xl border px-3 py-2 text-base"
            />
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm">Color</legend>
            <div className="flex flex-wrap gap-2">
              {brandColors.map((color) => (
                <label
                  key={color}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <input
                    type="radio"
                    name="brandColor"
                    value={color}
                    checked={brandColor === color}
                    onChange={() => setBrandColor(color)}
                  />
                  <span className={`inline-block size-3 rounded-full ${swatch[color]}`} />
                  {colorLabels[color]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1 text-sm">
            Instagram
            <input
              name="instagram"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="usuario"
              className="rounded-xl border px-3 py-2 text-base"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            Publicado
          </label>
          {state && "error" in state ? <p className="text-sm text-red-700">{state.error}</p> : null}
          {state && "ok" in state ? <p className="text-sm text-emerald-800">Guardado.</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-slate-900 px-4 py-3 text-base text-white disabled:opacity-60"
          >
            Guardar
          </button>
        </form>
        <SiteImagesEditor slug={slug} editor={editor} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Vista previa</p>
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border font-[family-name:var(--font-public-body)]">
          <PublicSiteTemplate
            slug={slug}
            accent={brandAccent[brandColor]}
            content={{
              name: editor.name,
              headline,
              about,
              instagram: instagram.replace(/^@/, "").trim() || null,
              phone: editor.phone,
              address: editor.address,
              hours: editor.hours,
              services: editor.services,
              images: {
                logo: editor.imageUrls.logo,
                cover: editor.imageUrls.cover,
                gallery: editor.imageUrls.gallery.map((photo) => photo.url),
              },
              showReserve: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
