"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { createServiceAction } from "@/modules/tenant-config/adapters/inbound/actions";
import { ServiceFormFields } from "@/modules/tenant-config/components/service-form-fields";

export function ServiceCreateScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createServiceAction, undefined);
  const [name, setName] = useState("");

  const listHref = `/${slug}/services` as Route;

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title="Agregar servicio"
      subtitle="Cargá el nombre, cuánto dura y cuánto sale."
      continueLabel={pending ? "Guardando…" : "Guardar"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueDisabled={name.trim() === ""}
      continueLoading={pending}
    >
      <form ref={formRef} action={formAction} className="grid gap-7">
        <input type="hidden" name="slug" value={slug} />
        <ServiceFormFields
          nameId="service-name"
          nameValue={name}
          onNameChange={setName}
          moreOptionsOpen={false}
        />
        {state?.message && !state.ok ? (
          <p role="alert" className="text-destructive text-sm font-medium">
            {state.message}
          </p>
        ) : null}
      </form>
    </PanelFormShell>
  );
}
