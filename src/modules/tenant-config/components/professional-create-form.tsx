"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProfessionalAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type { BranchRecord } from "@/modules/tenant-config/application/ports/catalog-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

export function ProfessionalCreateForm({
  slug,
  branches,
}: {
  slug: string;
  branches: BranchRecord[];
}) {
  const [state, formAction, pending] = useActionState(createProfessionalAction, undefined);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      {branches.length === 1 && branches[0] ? (
        <input type="hidden" name="branchId" value={branches[0].id} />
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="professional-branch">Sucursal</Label>
          <select
            id="professional-branch"
            name="branchId"
            required
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="">Elegí una sucursal</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="professional-name">Nombre para mostrar</Label>
        <Input id="professional-name" name="displayName" required maxLength={120} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="professional-color">Color (opcional)</Label>
        <Input
          id="professional-color"
          name="color"
          placeholder="#4F46E5"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar profesional"}
      </Button>
    </form>
  );
}
