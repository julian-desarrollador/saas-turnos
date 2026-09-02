"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { deleteCalendarBlockAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  BranchRecord,
  ProfessionalRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import type { CalendarBlockRecord } from "@/modules/tenant-config/application/ports/schedule-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function ownerLabel(
  block: CalendarBlockRecord,
  branches: BranchRecord[],
  professionals: ProfessionalRecord[],
): string {
  if (block.branchId) {
    return branches.find((branch) => branch.id === block.branchId)?.name ?? "Sucursal";
  }
  if (block.professionalId) {
    return (
      professionals.find((professional) => professional.id === block.professionalId)?.displayName ??
      "Profesional"
    );
  }
  return "Agenda";
}

function rangeLabel(block: CalendarBlockRecord): string {
  const dates =
    block.startDate === block.endDate
      ? formatDate(block.startDate)
      : `${formatDate(block.startDate)} – ${formatDate(block.endDate)}`;
  if (block.startTime && block.endTime) {
    return `${dates} · ${block.startTime}–${block.endTime}`;
  }
  return dates;
}

export function CalendarBlockList({
  slug,
  blocks,
  branches,
  professionals,
  canWrite,
}: {
  slug: string;
  blocks: CalendarBlockRecord[];
  branches: BranchRecord[];
  professionals: ProfessionalRecord[];
  canWrite: boolean;
}) {
  if (blocks.length === 0) {
    return <p className="text-muted-foreground text-sm">No hay bloqueos cargados.</p>;
  }

  return (
    <ul className="grid gap-3">
      {blocks.map((block) => (
        <BlockRow
          key={block.id}
          slug={slug}
          block={block}
          label={ownerLabel(block, branches, professionals)}
          canWrite={canWrite}
        />
      ))}
    </ul>
  );
}

function BlockRow({
  slug,
  block,
  label,
  canWrite,
}: {
  slug: string;
  block: CalendarBlockRecord;
  label: string;
  canWrite: boolean;
}) {
  const [state, formAction, pending] = useActionState(deleteCalendarBlockAction, undefined);

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
      <div className="grid gap-1 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{rangeLabel(block)}</p>
        {block.reason ? <p>{block.reason}</p> : null}
        <FormMessage state={state} />
      </div>
      {canWrite ? (
        <form action={formAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="blockId" value={block.id} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Quitando…" : "Quitar"}
          </Button>
        </form>
      ) : null}
    </li>
  );
}
