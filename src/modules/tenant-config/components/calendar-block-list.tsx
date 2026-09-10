"use client";

import { Fragment, useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { deleteCalendarBlockAction } from "@/modules/tenant-config/adapters/inbound/actions";
import type {
  BranchRecord,
  ProfessionalRecord,
} from "@/modules/tenant-config/application/ports/catalog-repository";
import type { CalendarBlockRecord } from "@/modules/tenant-config/application/ports/schedule-repository";
import { FormMessage } from "@/modules/tenant-config/components/form-message";

function formatDate(value: string): string {
  const [, month, day] = value.split("-");
  if (!month || !day) {
    return value;
  }
  return `${day}/${month}`;
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

function formatDayHeading(localDate: string): string {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));
  const instant = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(
    instant,
  );
  const dayMonth = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(instant);
  return `${weekday} ${dayMonth}`;
}

function DayDivider({ date }: { date: string }) {
  return (
    <li className="list-none">
      <div className="flex items-center gap-3">
        <span className="border-border h-px flex-1 border-t" />
        <span className="text-muted-foreground shrink-0 text-xs font-medium tracking-wide capitalize">
          {formatDayHeading(date)}
        </span>
        <span className="border-border h-px flex-1 border-t" />
      </div>
    </li>
  );
}

function blockTimeLabel(block: CalendarBlockRecord): string {
  if (block.startTime && block.endTime) {
    return `${block.startTime}–${block.endTime}`;
  }
  return "Todo el día";
}

function legacyUntilLabel(block: CalendarBlockRecord): string | null {
  if (block.startDate === block.endDate) {
    return null;
  }
  return `hasta ${formatDate(block.endDate)}`;
}

function blockDetailLabel(block: CalendarBlockRecord): string {
  const until = legacyUntilLabel(block);
  if (!until) {
    return blockTimeLabel(block);
  }
  return block.startTime && block.endTime ? `${until} · ${blockTimeLabel(block)}` : until;
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
      {blocks.map((block, index) => {
        const previousDate = index === 0 ? null : blocks[index - 1]?.startDate;
        const showDivider = previousDate !== block.startDate;
        return (
          <Fragment key={block.id}>
            {showDivider ? <DayDivider date={block.startDate} /> : null}
            <BlockRow
              slug={slug}
              block={block}
              label={ownerLabel(block, branches, professionals)}
              canWrite={canWrite}
            />
          </Fragment>
        );
      })}
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(deleteCalendarBlockAction, undefined);
  const detail = blockDetailLabel(block);
  const until = legacyUntilLabel(block);

  useEffect(() => {
    if (state?.message && !state.ok) {
      dialogRef.current?.showModal();
    }
  }, [state]);

  function openConfirm() {
    dialogRef.current?.showModal();
  }

  function closeConfirm() {
    if (pending) {
      return;
    }
    dialogRef.current?.close();
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
      <div className="grid gap-1 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{detail}</p>
        {block.reason ? <p>{block.reason}</p> : null}
        <FormMessage state={state} />
      </div>
      {canWrite ? (
        <>
          <Button type="button" variant="secondary" disabled={pending} onClick={openConfirm}>
            {pending ? "Quitando…" : "Quitar"}
          </Button>

          <dialog
            ref={dialogRef}
            className="bg-card text-foreground fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-5 shadow-xl backdrop:bg-black/40"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeConfirm();
              }
            }}
            onCancel={(event) => {
              if (pending) {
                event.preventDefault();
              }
            }}
          >
            <h3 className="text-xl font-bold tracking-tight">Quitar bloqueo</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              ¿Estás seguro que deseás quitar el bloqueo de {label}
              {until ? ` (${detail})` : ""}? Esta acción no se puede deshacer.
            </p>

            <form action={formAction} className="mt-4 grid gap-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="blockId" value={block.id} />

              {state?.message && !state.ok ? (
                <p className="text-destructive text-sm">{state.message}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 cursor-pointer rounded-xl px-3"
                  disabled={pending}
                  onClick={closeConfirm}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="h-10 cursor-pointer rounded-xl px-3 font-semibold"
                  disabled={pending}
                >
                  {pending ? "Quitando…" : "Sí, quitar"}
                </Button>
              </div>
            </form>
          </dialog>
        </>
      ) : null}
    </li>
  );
}
