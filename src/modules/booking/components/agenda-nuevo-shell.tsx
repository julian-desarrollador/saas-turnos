import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AgendaNuevoShell({
  onBack,
  closeHref,
  title,
  subtitle,
  summary,
  children,
  continueLabel,
  onContinue,
  continueDisabled = false,
  continueLoading = false,
  hideContinue = false,
}: {
  onBack: () => void;
  closeHref: Route;
  title: string;
  subtitle: string;
  summary?: ReactNode;
  children: ReactNode;
  continueLabel: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  hideContinue?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col px-4 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-28">
      <header className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="hover:bg-muted -ml-1 flex size-10 items-center justify-center rounded-xl"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </button>
        <Link
          href={closeHref}
          className="text-muted-foreground px-1 text-base font-medium underline-offset-4 hover:underline"
        >
          Cerrar
        </Link>
      </header>

      <section className="pb-4">
        <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-1.5 text-base sm:text-lg">{subtitle}</p>
      </section>

      {summary ? (
        <div className="border-border bg-muted/60 -mx-4 mb-2 flex items-center justify-between gap-3 border-y px-4 py-3">
          {summary}
        </div>
      ) : null}

      <main className="flex-1 pt-4">{children}</main>

      {!hideContinue ? (
        <div className="border-border bg-background fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 border-t px-4 pt-3 pb-2 md:bottom-0">
          <div className="mx-auto max-w-md">
            <button
              type="button"
              disabled={continueDisabled || continueLoading}
              onClick={onContinue}
              className={cn(
                "bg-primary text-primary-foreground w-full cursor-pointer rounded-[30px] py-4 text-lg font-semibold shadow-lg transition active:scale-[0.99]",
                (continueDisabled || continueLoading) && "cursor-not-allowed opacity-45",
                continueLoading && "cursor-wait",
              )}
            >
              {continueLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
