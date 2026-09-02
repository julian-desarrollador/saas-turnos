"use server";

import { revalidatePath } from "next/cache";

import { ForbiddenError, hasPermission, type Role } from "@/core/authorization";
import { createPrismaCatalogRepositories } from "@/modules/tenant-config/adapters/outbound/prisma-catalog-repository";
import { createPrismaScheduleRepositories } from "@/modules/tenant-config/adapters/outbound/prisma-schedule-repository";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import type {
  ScheduleOwner,
  WeeklySlotInput,
} from "@/modules/tenant-config/application/ports/schedule-repository";
import { createListBranches } from "@/modules/tenant-config/application/use-cases/branches";
import {
  createCreateCalendarBlock,
  createDeleteCalendarBlock,
  createListCalendarBlocks,
} from "@/modules/tenant-config/application/use-cases/blocks";
import {
  createCreateProfessional,
  createListProfessionals,
  createSetProfessionalServices,
  createUpdateProfessional,
} from "@/modules/tenant-config/application/use-cases/professionals";
import {
  createListWeeklySlots,
  createSetWeeklySchedule,
} from "@/modules/tenant-config/application/use-cases/schedules";
import {
  createCreateService,
  createListServices,
  createUpdateService,
} from "@/modules/tenant-config/application/use-cases/services";
import { resolveTenantContext } from "@/server/auth";
import { db } from "@/server/db";

import { validationMessage } from "./messages";

export type ActionState = {
  ok: boolean;
  message?: string;
};

const catalogRepos = createPrismaCatalogRepositories(db);
const scheduleRepos = createPrismaScheduleRepositories(db);

const listBranches = createListBranches(catalogRepos);
const listProfessionals = createListProfessionals(catalogRepos);
const createProfessional = createCreateProfessional(catalogRepos);
const updateProfessional = createUpdateProfessional(catalogRepos);
const setProfessionalServices = createSetProfessionalServices(catalogRepos);
const listServices = createListServices(catalogRepos);
const createService = createCreateService(catalogRepos);
const updateService = createUpdateService(catalogRepos);
const listWeeklySlots = createListWeeklySlots(scheduleRepos);
const setWeeklySchedule = createSetWeeklySchedule(scheduleRepos);
const listCalendarBlocks = createListCalendarBlocks(scheduleRepos);
const createCalendarBlock = createCreateCalendarBlock(scheduleRepos);
const deleteCalendarBlock = createDeleteCalendarBlock(scheduleRepos);

function actorFrom(ctx: { tenant: { id: string }; membership: { role: Role } }) {
  return { tenantId: ctx.tenant.id, role: ctx.membership.role };
}

function toActionState(error: unknown): ActionState {
  if (error instanceof ForbiddenError) {
    return { ok: false, message: "No tenés permiso para esta acción." };
  }
  if (error instanceof TenantConfigError && error.code === "NOT_FOUND") {
    return { ok: false, message: "No encontramos ese registro." };
  }
  if (error instanceof TenantConfigError && error.code === "VALIDATION") {
    return { ok: false, message: validationMessage(error.reason) };
  }
  throw error;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = readString(formData, key).trim();
  return value === "" ? null : value;
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const raw = readString(formData, key).trim();
  if (raw === "") {
    return fallback;
  }
  return Number(raw);
}

function readCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function readTime(formData: FormData, key: string): string | null {
  const value = readOptionalString(formData, key);
  if (!value) {
    return null;
  }
  return value.slice(0, 5);
}

function readOwner(formData: FormData): ScheduleOwner {
  const combined = readString(formData, "owner");
  if (combined.includes(":")) {
    const separator = combined.indexOf(":");
    const kind = combined.slice(0, separator);
    const id = combined.slice(separator + 1);
    if (kind === "branch" || kind === "professional") {
      return { kind, id };
    }
  }

  const kind = readString(formData, "ownerKind");
  const id = readString(formData, "ownerId");
  if (kind === "branch" || kind === "professional") {
    return { kind, id };
  }
  return { kind: "branch", id: "" };
}

/** Safety cap while reading consecutive d{day}s{index} fields. The form shows at most 4. */
const MAX_WEEKLY_SLOTS_PER_DAY = 24;

function readWeeklySlots(formData: FormData): WeeklySlotInput[] {
  const slots: WeeklySlotInput[] = [];
  for (let day = 0; day <= 6; day += 1) {
    for (let index = 0; index < MAX_WEEKLY_SLOTS_PER_DAY; index += 1) {
      const startTime = readTime(formData, `d${day}s${index}Start`);
      const endTime = readTime(formData, `d${day}s${index}End`);
      if (!startTime && !endTime) {
        break;
      }
      slots.push({
        dayOfWeek: day,
        startTime: startTime ?? "",
        endTime: endTime ?? "",
        capacity: readInt(formData, `d${day}s${index}Capacity`, 1),
      });
    }
  }
  return slots;
}

async function actorForSlug(slug: string) {
  const ctx = await resolveTenantContext(slug);
  return { ctx, actor: actorFrom(ctx) };
}

export async function loadProfessionalsPage(slug: string) {
  const { ctx, actor } = await actorForSlug(slug);
  const [professionals, services, branches] = await Promise.all([
    listProfessionals(actor),
    listServices(actor),
    listBranches(actor),
  ]);
  return {
    tenantName: ctx.tenant.name,
    role: actor.role,
    canWrite: hasPermission(actor.role, "catalog.write"),
    professionals,
    services,
    branches,
  };
}

export async function loadServicesPage(slug: string) {
  const { ctx, actor } = await actorForSlug(slug);
  const services = await listServices(actor);
  return {
    tenantName: ctx.tenant.name,
    role: actor.role,
    canWrite: hasPermission(actor.role, "catalog.write"),
    services,
  };
}

export async function createProfessionalAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await createProfessional({
      actor,
      displayName: readString(formData, "displayName"),
      color: readOptionalString(formData, "color"),
      branchId: readOptionalString(formData, "branchId"),
    });
    revalidatePath(`/${slug}/professionals`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateProfessionalAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    const isActiveRaw = readString(formData, "isActive");
    await updateProfessional({
      actor,
      professionalId: readString(formData, "professionalId"),
      displayName: readString(formData, "displayName") || undefined,
      color: formData.has("color") ? readOptionalString(formData, "color") : undefined,
      isActive: isActiveRaw === "" ? undefined : isActiveRaw === "true",
    });
    revalidatePath(`/${slug}/professionals`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function setProfessionalServicesAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await setProfessionalServices({
      actor,
      professionalId: readString(formData, "professionalId"),
      serviceIds: formData
        .getAll("serviceId")
        .filter((value): value is string => typeof value === "string"),
    });
    revalidatePath(`/${slug}/professionals`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function createServiceAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await createService({
      actor,
      name: readString(formData, "name"),
      durationMinutes: readInt(formData, "durationMinutes"),
      priceAmount: readInt(formData, "priceAmount"),
      prepMinutes: readInt(formData, "prepMinutes", 0),
      cleanupMinutes: readInt(formData, "cleanupMinutes", 0),
      earliestStart: readOptionalString(formData, "earliestStart"),
      latestStart: readOptionalString(formData, "latestStart"),
      requiresDeposit: readCheckbox(formData, "requiresDeposit"),
    });
    revalidatePath(`/${slug}/services`);
    revalidatePath(`/${slug}/professionals`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateServiceAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    const isActiveRaw = readString(formData, "isActive");
    await updateService({
      actor,
      serviceId: readString(formData, "serviceId"),
      name: readString(formData, "name") || undefined,
      durationMinutes: formData.has("durationMinutes")
        ? readInt(formData, "durationMinutes")
        : undefined,
      priceAmount: formData.has("priceAmount") ? readInt(formData, "priceAmount") : undefined,
      prepMinutes: formData.has("prepMinutes") ? readInt(formData, "prepMinutes", 0) : undefined,
      cleanupMinutes: formData.has("cleanupMinutes")
        ? readInt(formData, "cleanupMinutes", 0)
        : undefined,
      earliestStart: formData.has("earliestStart")
        ? readOptionalString(formData, "earliestStart")
        : undefined,
      latestStart: formData.has("latestStart")
        ? readOptionalString(formData, "latestStart")
        : undefined,
      requiresDeposit: formData.has("requiresDepositSubmitted")
        ? readCheckbox(formData, "requiresDeposit")
        : undefined,
      isActive: isActiveRaw === "" ? undefined : isActiveRaw === "true",
    });
    revalidatePath(`/${slug}/services`);
    revalidatePath(`/${slug}/professionals`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function loadSchedulePage(slug: string) {
  const { ctx, actor } = await actorForSlug(slug);
  const [branches, professionals, slots, blocks] = await Promise.all([
    listBranches(actor),
    listProfessionals(actor),
    listWeeklySlots(actor),
    listCalendarBlocks(actor),
  ]);
  return {
    tenantName: ctx.tenant.name,
    canWriteSchedule: hasPermission(actor.role, "schedule.write"),
    canWriteBlocks: hasPermission(actor.role, "block.write"),
    branches,
    professionals,
    slots,
    blocks,
  };
}

export async function setWeeklyScheduleAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await setWeeklySchedule({
      actor,
      owner: readOwner(formData),
      slots: readWeeklySlots(formData),
    });
    revalidatePath(`/${slug}/schedule`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function createCalendarBlockAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await createCalendarBlock({
      actor,
      owner: readOwner(formData),
      startDate: readString(formData, "startDate"),
      endDate: readString(formData, "endDate"),
      startTime: readTime(formData, "startTime"),
      endTime: readTime(formData, "endTime"),
      reason: readOptionalString(formData, "reason"),
    });
    revalidatePath(`/${slug}/schedule`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}

export async function deleteCalendarBlockAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  try {
    const { actor } = await actorForSlug(slug);
    await deleteCalendarBlock({
      actor,
      blockId: readString(formData, "blockId"),
    });
    revalidatePath(`/${slug}/schedule`);
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}
