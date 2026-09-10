import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function SelectCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer rounded-2xl border px-4 py-4 text-left shadow-sm transition",
        selected
          ? "border-primary bg-primary/5 ring-primary/25 ring-2"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{title}</p>
          {subtitle ? <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p> : null}
        </div>
        {selected ? (
          <span className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
            <Check className="size-3" strokeWidth={2.5} />
            Seleccionado
          </span>
        ) : null}
      </div>
    </button>
  );
}
