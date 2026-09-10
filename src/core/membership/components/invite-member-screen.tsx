"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { SelectCard } from "@/components/shared/select-card";
import type { InvitableRole } from "@/core/membership/application/ports/membership-repository";
import { inviteMemberAction } from "@/core/membership/adapters/inbound/actions";
import { inviteRoleOptions } from "@/core/membership/adapters/inbound/messages";
import { membershipRoleBlurb } from "@/core/membership/components/member-view";

const FIELD_CLASS =
  "border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2";

export function InviteMemberScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(inviteMemberAction, undefined);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("RECEPTION");

  const listHref = `/${slug}/members` as Route;

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title="Invitar"
      subtitle="Va a recibir un correo para entrar al panel. No aparece en la agenda hasta que la cargues en Equipo."
      continueLabel={pending ? "Enviando…" : "Enviar invitación"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueDisabled={email.trim() === ""}
      continueLoading={pending}
    >
      <form ref={formRef} action={formAction} className="grid gap-7">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="role" value={role} />

        <div className="grid gap-2">
          <label htmlFor="invite-email" className="text-base font-semibold">
            Correo
          </label>
          <p className="text-muted-foreground text-sm">Ahí le llega la invitación.</p>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            placeholder="ana@correo.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            className={FIELD_CLASS}
          />
        </div>

        <div className="grid gap-2">
          <p className="text-base font-semibold">Qué va a poder hacer</p>
          <p className="text-muted-foreground text-sm">Elegí un rol. El dueño no se invita.</p>
          <div className="grid gap-2">
            {inviteRoleOptions.map((option) => (
              <SelectCard
                key={option.value}
                selected={role === option.value}
                onClick={() => {
                  setRole(option.value);
                }}
                title={option.label}
                subtitle={membershipRoleBlurb(option.value)}
              />
            ))}
          </div>
        </div>

        {state?.message && !state.ok ? (
          <p role="alert" className="text-destructive text-sm font-medium">
            {state.message}
          </p>
        ) : null}
      </form>
    </PanelFormShell>
  );
}
