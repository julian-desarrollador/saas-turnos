"use client";

import { Search } from "lucide-react";

export function ClientSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="border-border bg-card rounded-[24px] border p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <label htmlFor="clients-query" className="sr-only">
        Buscar por nombre o WhatsApp
      </label>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          id="clients-query"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar por nombre o WhatsApp…"
          autoComplete="off"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border pr-3 pl-9 text-base outline-none focus-visible:ring-[3px]"
        />
      </div>
    </div>
  );
}
