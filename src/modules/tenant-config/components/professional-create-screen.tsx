"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { PanelFormShell } from "@/components/shared/panel-form-shell";
import { createProfessionalAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  BranchRecord,
  ServiceRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import { ServiceChecklist } from "@/modules/tenant-config/components/service-checklist";

export function ProfessionalCreateScreen({
  slug,
  services,
  branches,
}: {
  slug: string;
  services: ServiceRecord[];
  branches: BranchRecord[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createProfessionalAction, undefined);
  const [displayName, setDisplayName] = useState("");

  const listHref = `/${slug}/professionals` as Route;
  const onlyBranch = branches.length === 1 ? branches[0] : null;

  return (
    <PanelFormShell
      onBack={() => {
        router.push(listHref);
      }}
      closeHref={listHref}
      title="Agregar profesional"
      subtitle="Cargá el nombre y qué servicios hace."
      continueLabel={pending ? "Guardando…" : "Guardar"}
      onContinue={() => {
        formRef.current?.requestSubmit();
      }}
      continueDisabled={displayName.trim() === ""}
      continueLoading={pending}
    >
      <form ref={formRef} action={formAction} className="grid gap-7">
        <input type="hidden" name="slug" value={slug} />
        {onlyBranch ? <input type="hidden" name="branchId" value={onlyBranch.id} /> : null}

        <div className="grid gap-2">
          <label htmlFor="professional-name" className="text-base font-semibold">
            Nombre
          </label>
          <p className="text-muted-foreground text-sm">
            Es el nombre que ven tus clientes al reservar.
          </p>
          <input
            id="professional-name"
            name="displayName"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Ana Pérez"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
            }}
            className="border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2"
          />
        </div>

        {onlyBranch ? null : (
          <div className="grid gap-2">
            <label htmlFor="professional-branch" className="text-base font-semibold">
              Sucursal
            </label>
            <p className="text-muted-foreground text-sm">Dónde atiende esta persona.</p>
            <select
              id="professional-branch"
              name="branchId"
              required
              defaultValue=""
              className="border-input focus-visible:border-primary focus-visible:ring-primary/25 h-12 rounded-2xl border bg-transparent px-4 text-base outline-none focus-visible:ring-2"
            >
              <option value="" disabled>
                Elegí una sucursal
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-2">
          <p className="text-base font-semibold">Servicios que hace</p>
          <p className="text-muted-foreground text-sm">
            Marcá todos los que corresponda. Podés cambiarlos cuando quieras.
          </p>
          <ServiceChecklist services={services} selectedIds={[]} />
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
