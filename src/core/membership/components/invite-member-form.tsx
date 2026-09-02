"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMemberAction, type ActionState } from "@/core/membership/adapters/inbound/actions";
import { inviteRoleOptions } from "@/core/membership/adapters/inbound/messages";

export function InviteMemberForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, undefined);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-1.5">
        <Label htmlFor="invite-email">Correo</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="invite-role">Rol</Label>
        <select
          id="invite-role"
          name="role"
          required
          defaultValue="RECEPTION"
          className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
        >
          {inviteRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <InviteFormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar invitación"}
      </Button>
    </form>
  );
}

function InviteFormMessage({ state }: { state: ActionState | undefined }) {
  if (!state?.message) {
    return null;
  }
  return (
    <p className={state.ok ? "text-muted-foreground text-sm" : "text-destructive text-sm"}>
      {state.message}
    </p>
  );
}
