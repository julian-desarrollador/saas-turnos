"use client";

import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const ENTER_DELAY_MS = 2800;
const UNMOUNT_DELAY_MS = 3100;

/** Saca de la URL las marcas que dispararon el toast, sin navegar. */
export function clearQueryKeysFromUrl(keys: readonly string[]) {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) {
    return;
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

export function ToastShell({
  entered,
  interactive = false,
  children,
}: {
  entered: boolean;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 z-50 flex justify-center px-4 transition-all duration-300 ease-out",
        interactive ? "pointer-events-auto" : "pointer-events-none",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]",
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <div className="bg-foreground text-background flex max-w-sm items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        {children}
      </div>
    </div>
  );
}

/**
 * Toast de confirmación que aparece una vez y se oculta solo.
 * `queryKeys` debe ser una constante de módulo: se lee al montar.
 */
export function FeedbackToast({
  message,
  queryKeys,
}: {
  message: string | null;
  queryKeys?: readonly string[];
}) {
  const [initialMessage] = useState(message);
  const [mounted, setMounted] = useState(Boolean(initialMessage));
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!initialMessage) {
      return;
    }

    if (queryKeys && queryKeys.length > 0) {
      clearQueryKeysFromUrl(queryKeys);
    }

    const enterFrame = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    const hideTimer = window.setTimeout(() => {
      setEntered(false);
    }, ENTER_DELAY_MS);
    const unmountTimer = window.setTimeout(() => {
      setMounted(false);
    }, UNMOUNT_DELAY_MS);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(hideTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [initialMessage, queryKeys]);

  if (!mounted || !initialMessage) {
    return null;
  }

  return (
    <ToastShell entered={entered}>
      <Check className="size-4 shrink-0" strokeWidth={2.5} />
      <span className="min-w-0 truncate">{initialMessage}</span>
    </ToastShell>
  );
}
