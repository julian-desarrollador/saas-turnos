import { Lock } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";

function blockScope(block: MonthBlockRecord): string {
  if (block.professionalName) {
    return block.professionalName;
  }
  if (block.branchName) {
    return block.branchName;
  }
  return "Sucursal";
}

function blockTimeLabel(block: MonthBlockRecord): string {
  if (block.startTime && block.endTime) {
    return `${block.startTime}–${block.endTime}`;
  }
  return "Día completo";
}

export function AgendaBlockCard({ slug, block }: { slug: string; block: MonthBlockRecord }) {
  return (
    <article className="bg-card overflow-hidden rounded-[22px] border shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="bg-muted text-foreground rounded-full px-3.5 py-1.5 text-sm leading-none font-semibold tracking-tight tabular-nums">
            {blockTimeLabel(block)}
          </span>
          <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em]">
            BLOQUEO
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Lock className="text-muted-foreground size-5 shrink-0" strokeWidth={2} />
          <h3 className="text-lg font-bold">Bloqueo de agenda</h3>
        </div>

        <p className="text-muted-foreground mt-1 text-sm">{blockScope(block)}</p>

        {block.reason ? (
          <p className="bg-muted/60 mt-3 rounded-xl px-3 py-2 text-sm leading-snug">
            {block.reason}
          </p>
        ) : null}

        <Link
          href={`/${slug}/schedule` as Route}
          className="border-border hover:bg-muted mt-3 flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition"
        >
          Ver en Horarios
        </Link>
      </div>
    </article>
  );
}
