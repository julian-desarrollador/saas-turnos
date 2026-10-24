"use client";

import { useState } from "react";

export function CopyBookingLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <p className="rounded-md border px-3 py-2 text-sm break-all">{href}</p>
      <button
        type="button"
        className="w-fit rounded-md border px-3 py-2 text-sm"
        onClick={() => {
          void navigator.clipboard.writeText(href).then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
