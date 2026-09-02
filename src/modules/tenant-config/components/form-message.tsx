"use client";

import type { ActionState } from "@/modules/tenant-config/adapters/inbound/actions";

export function FormMessage({ state }: { state: ActionState | undefined }) {
  if (!state?.message || state.ok) {
    return null;
  }
  return <p className="text-destructive text-sm">{state.message}</p>;
}
