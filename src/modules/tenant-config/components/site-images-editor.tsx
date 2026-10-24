"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import {
  SITE_GALLERY_MAX as GALLERY_MAX,
  siteImageTypes,
} from "@/modules/tenant-config/application/site-image-rules";
import {
  confirmSiteImageAction,
  removeSiteImageAction,
  requestSiteImageUploadAction,
  type SiteEditorData,
} from "@/modules/tenant-config/adapters/inbound/site-actions";

type Kind = "logo" | "cover" | "gallery";

const accepted = siteImageTypes.join(",");

export function SiteImagesEditor({ slug, editor }: { slug: string; editor: SiteEditorData }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Kind | null>(null);
  const [, startTransition] = useTransition();
  const disabled = !editor.uploadsEnabled || busy !== null;

  function upload(kind: Kind, file: File) {
    setError("");
    setBusy(kind);
    startTransition(async () => {
      try {
        const ticket = await requestSiteImageUploadAction(slug, {
          kind,
          contentType: file.type,
          size: file.size,
        });
        if ("error" in ticket) {
          setError(ticket.error);
          return;
        }
        const put = await fetch(ticket.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!put.ok) {
          setError("No se pudo subir la foto. Probá de nuevo.");
          return;
        }
        const done = await confirmSiteImageAction(slug, { kind, key: ticket.key });
        if (done && "error" in done) {
          setError(done.error);
        }
      } catch {
        setError("No se pudo subir la foto. Revisá la conexión y probá de nuevo.");
      } finally {
        setBusy(null);
      }
    });
  }

  function remove(kind: Kind, key?: string) {
    setError("");
    setBusy(kind);
    startTransition(async () => {
      const done = await removeSiteImageAction(slug, { kind, key });
      if (done && "error" in done) {
        setError(done.error);
      }
      setBusy(null);
    });
  }

  return (
    <section className="grid gap-4 rounded-2xl border p-4">
      <div>
        <h2 className="text-lg font-semibold">Fotos</h2>
        <p className="text-muted-foreground text-sm">JPG, PNG o WebP de hasta 5 MB.</p>
      </div>
      {!editor.uploadsEnabled ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          La carga de fotos todavía no está conectada. Mientras tanto, el sitio usa la inicial del
          negocio en lugar del logo y un bloque oscuro en lugar de la portada.
        </p>
      ) : null}

      <ImageSlot
        label="Logo"
        hint="Cuadrado, se ve en un círculo."
        url={editor.imageUrls.logo}
        busy={busy === "logo"}
        disabled={disabled}
        onPick={(file) => upload("logo", file)}
        onRemove={() => remove("logo")}
      />
      <ImageSlot
        label="Portada"
        hint="Vertical u horizontal: se recorta para ocupar el alto del celular."
        url={editor.imageUrls.cover}
        busy={busy === "cover"}
        disabled={disabled}
        onPick={(file) => upload("cover", file)}
        onRemove={() => remove("cover")}
      />

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Galería</p>
          <p className="text-muted-foreground text-xs">
            {editor.imageUrls.gallery.length} de {GALLERY_MAX}
          </p>
        </div>
        {editor.imageUrls.gallery.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2">
            {editor.imageUrls.gallery.map((photo) => (
              <li
                key={photo.key}
                className="relative aspect-square overflow-hidden rounded-lg border"
              >
                <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove("gallery", photo.key)}
                  className="absolute top-1 right-1 rounded-full bg-black/70 px-2 text-xs text-white disabled:opacity-50"
                  aria-label="Borrar foto"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <FilePicker
          label={busy === "gallery" ? "Subiendo…" : "Agregar foto"}
          disabled={disabled || editor.imageUrls.gallery.length >= GALLERY_MAX}
          onPick={(file) => upload("gallery", file)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ImageSlot({
  label,
  hint,
  url,
  busy,
  disabled,
  onPick,
  onRemove,
}: {
  label: string;
  hint: string;
  url: string | null;
  busy: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-muted relative block size-16 shrink-0 overflow-hidden rounded-lg border">
        {url ? <Image src={url} alt="" fill sizes="64px" className="object-cover" /> : null}
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
        <div className="flex gap-2">
          <FilePicker
            label={busy ? "Subiendo…" : url ? "Cambiar" : "Subir"}
            disabled={disabled}
            onPick={onPick}
          />
          {url ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Quitar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilePicker({
  label,
  disabled,
  onPick,
}: {
  label: string;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <label
      className={
        disabled
          ? "inline-flex w-fit cursor-not-allowed rounded-xl border px-3 py-1.5 text-sm opacity-50"
          : "inline-flex w-fit cursor-pointer rounded-xl border px-3 py-1.5 text-sm"
      }
    >
      {label}
      <input
        type="file"
        accept={accepted}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onPick(file);
          }
        }}
      />
    </label>
  );
}
