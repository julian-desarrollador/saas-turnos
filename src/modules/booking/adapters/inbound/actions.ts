"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ForbiddenError, hasPermission } from "@/core/authorization";
import { createPrismaAvailabilityRepository } from "@/modules/booking/adapters/outbound/prisma-availability-repository";
import { BookingError } from "@/modules/booking/application/errors";
import { emptySlotsReason } from "@/modules/booking/application/offered-from-snapshot";
import { createCancelAppointment } from "@/modules/booking/application/use-cases/cancel-appointment";
import { createCreateAppointment } from "@/modules/booking/application/use-cases/create-appointment";
import { createGetAppointment } from "@/modules/booking/application/use-cases/get-appointment";
import {
  createListAgendaCatalog,
  createListAvailableSlots,
} from "@/modules/booking/application/use-cases/list-available-slots";
import {
  createListDayAppointments,
  occupancyEndTime,
} from "@/modules/booking/application/use-cases/list-day-appointments";
import {
  createListMonthAgenda,
  type MonthAppointment,
} from "@/modules/booking/application/use-cases/list-month-agenda";
import { createListRescheduleProfessionals } from "@/modules/booking/application/use-cases/list-reschedule-professionals";
import type { MonthBlockRecord } from "@/modules/booking/application/ports/availability-repository";
import { createMarkCompleted } from "@/modules/booking/application/use-cases/mark-completed";
import { createMarkNoShow } from "@/modules/booking/application/use-cases/mark-no-show";
import { createRescheduleAppointment } from "@/modules/booking/application/use-cases/reschedule-appointment";
import { canRescheduleAppointment } from "@/modules/booking/domain/appointment-lifecycle";
import { isYearMonth, yearMonthFromDate } from "@/modules/booking/domain/month-grid";
import {
  addLocalDays,
  isLocalDate,
  isLocalTime,
  zonedCivilNow,
} from "@/modules/booking/domain/time";
import {
  ClientsError,
  clientsValidationMessage,
  createFindOrCreateClient,
  createPrismaClientRepository,
} from "@/modules/clients";
import { resolveTenantContext } from "@/server/auth";
import { db, tenantDb } from "@/server/db";

import { validationMessage } from "./messages";

export type ActionState = {
  ok: boolean;
  message?: string;
};

const repo = createPrismaAvailabilityRepository(db, tenantDb);
const listAgendaCatalog = createListAgendaCatalog(repo);
const listAvailableSlots = createListAvailableSlots(repo);
const listRescheduleProfessionals = createListRescheduleProfessionals(repo);
const listDayAppointments = createListDayAppointments(repo);
const listMonthAgenda = createListMonthAgenda(repo);
const createAppointment = createCreateAppointment(repo);
const rescheduleAppointment = createRescheduleAppointment(repo);
const getAppointment = createGetAppointment(repo);
const cancelAppointment = createCancelAppointment(repo);
const markNoShow = createMarkNoShow(repo);
const markCompleted = createMarkCompleted(repo);
const findOrCreateClient = createFindOrCreateClient(createPrismaClientRepository(db, tenantDb));

function readQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

function readOptionalLocalDate(value: string | string[] | undefined): string | null {
  const raw = readQueryValue(value);
  return isLocalDate(raw) ? raw : null;
}

function readOptionalLocalTime(value: string | string[] | undefined): string | null {
  const raw = readQueryValue(value);
  return isLocalTime(raw) ? raw : null;
}

function readOptionalBlockWho(value: string | string[] | undefined): string | null {
  const trimmed = readQueryValue(value).trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 119)}…` : trimmed;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = readString(formData, key).trim();
  return value === "" ? null : value;
}

function preferredServiceId(serviceIds: string[], services: { id: string }[]): string {
  const offered = services.find((service) => serviceIds.includes(service.id));
  return offered?.id ?? services[0]?.id ?? "";
}

function agendaHomeHref(
  slug: string,
  query: {
    date: string;
    month?: string;
    showCancelled?: boolean;
    booked?: boolean;
    cancelled?: boolean;
    rescheduled?: boolean;
    noShow?: boolean;
    completed?: boolean;
    blocked?: boolean;
    blockFrom?: string;
    blockTo?: string;
    blockStart?: string;
    blockEnd?: string;
    blockWho?: string;
  },
): string {
  const params = new URLSearchParams();
  params.set("date", query.date);
  const month = query.month ?? yearMonthFromDate(query.date);
  params.set("month", month);
  if (query.showCancelled) {
    params.set("showCancelled", "1");
  }
  if (query.booked) {
    params.set("booked", "1");
  }
  if (query.cancelled) {
    params.set("cancelled", "1");
  }
  if (query.rescheduled) {
    params.set("rescheduled", "1");
  }
  if (query.noShow) {
    params.set("noShow", "1");
  }
  if (query.completed) {
    params.set("completed", "1");
  }
  if (query.blocked) {
    params.set("blocked", "1");
    if (query.blockFrom) {
      params.set("blockFrom", query.blockFrom);
    }
    if (query.blockTo) {
      params.set("blockTo", query.blockTo);
    }
    if (query.blockStart) {
      params.set("blockStart", query.blockStart);
    }
    if (query.blockEnd) {
      params.set("blockEnd", query.blockEnd);
    }
    if (query.blockWho) {
      params.set("blockWho", query.blockWho);
    }
  }
  return `/${slug}/agenda?${params.toString()}`;
}

export type AgendaMonthPayload = {
  yearMonth: string;
  appointments: MonthAppointment[];
  blocks: MonthBlockRecord[];
};

export async function loadAgendaHomePage(
  slug: string,
  query: {
    date?: string | string[];
    month?: string | string[];
    showCancelled?: string | string[];
    booked?: string | string[];
    cancelled?: string | string[];
    rescheduled?: string | string[];
    noShow?: string | string[];
    completed?: string | string[];
    blocked?: string | string[];
    blockFrom?: string | string[];
    blockTo?: string | string[];
    blockStart?: string | string[];
    blockEnd?: string | string[];
    blockWho?: string | string[];
  },
) {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const today = zonedCivilNow(ctx.tenant.timezone, new Date()).localDate;
  const requestedDate = readQueryValue(query.date);
  const date = isLocalDate(requestedDate) ? requestedDate : today;
  const requestedMonth = readQueryValue(query.month);
  const month =
    isYearMonth(requestedMonth) && date.startsWith(requestedMonth)
      ? requestedMonth
      : yearMonthFromDate(date);
  const agenda = await listMonthAgenda({ actor, yearMonth: month });

  return {
    slug,
    tenantName: ctx.tenant.name,
    today,
    initialDate: date,
    initialMonth: month,
    initialShowCancelled: readQueryValue(query.showCancelled) === "1",
    canWrite: hasPermission(actor.role, "booking.write"),
    appointments: agenda.appointments,
    blocks: agenda.blocks,
    booked: readQueryValue(query.booked) === "1",
    cancelled: readQueryValue(query.cancelled) === "1",
    rescheduled: readQueryValue(query.rescheduled) === "1",
    noShow: readQueryValue(query.noShow) === "1",
    completed: readQueryValue(query.completed) === "1",
    blocked: readQueryValue(query.blocked) === "1",
    blockFrom: readOptionalLocalDate(query.blockFrom) ?? readOptionalLocalDate(query.date),
    blockTo: readOptionalLocalDate(query.blockTo),
    blockStart: readOptionalLocalTime(query.blockStart),
    blockEnd: readOptionalLocalTime(query.blockEnd),
    blockWho: readOptionalBlockWho(query.blockWho),
  };
}

export async function fetchAgendaMonthAction(
  slug: string,
  yearMonth: string,
): Promise<AgendaMonthPayload> {
  if (!isYearMonth(yearMonth)) {
    throw new BookingError("VALIDATION", "DATE_INVALID", "yearMonth");
  }
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const agenda = await listMonthAgenda({ actor, yearMonth });
  return {
    yearMonth: agenda.yearMonth,
    appointments: agenda.appointments,
    blocks: agenda.blocks,
  };
}

export async function loadAgendaNuevoPage(
  slug: string,
  query: {
    date?: string | string[];
  },
) {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const catalog = await listAgendaCatalog(actor);
  const today = zonedCivilNow(ctx.tenant.timezone, new Date()).localDate;
  const requestedDate = readQueryValue(query.date);
  const initialDate = isLocalDate(requestedDate) ? requestedDate : today;

  return {
    slug,
    tenantName: ctx.tenant.name,
    today,
    initialDate,
    canWrite: hasPermission(actor.role, "booking.write"),
    professionals: catalog.professionals,
    services: catalog.services,
    catalogEmptyReason: catalogEmptyReason(catalog),
  };
}

export type AvailableSlotsPayload = {
  slots: string[];
  emptyReason: ReturnType<typeof emptySlotsReason>;
  error?: string;
};

export async function fetchAvailableSlotsAction(
  slug: string,
  professionalId: string,
  serviceId: string,
  localDate: string,
): Promise<AvailableSlotsPayload> {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const now = new Date();

  if (!professionalId || !serviceId || !isLocalDate(localDate)) {
    return { slots: [], emptyReason: null, error: "Revisá profesional, servicio y fecha." };
  }

  try {
    const slots = await listAvailableSlots({
      actor,
      professionalId,
      serviceId,
      localDate,
      now,
    });
    if (slots.length > 0) {
      return { slots, emptyReason: null };
    }
    const snapshot = await repo.loadSnapshot(actor.tenantId, professionalId, serviceId, localDate);
    return {
      slots: [],
      emptyReason: snapshot ? emptySlotsReason(snapshot, localDate, now) : null,
    };
  } catch (caught) {
    if (caught instanceof ForbiddenError) {
      throw caught;
    }
    if (caught instanceof BookingError && caught.code === "NOT_FOUND") {
      return { slots: [], emptyReason: null, error: "No encontramos ese profesional o servicio." };
    }
    if (caught instanceof BookingError) {
      return { slots: [], emptyReason: null, error: validationMessage(caught.reason) };
    }
    throw caught;
  }
}

export async function loadAgendaPage(
  slug: string,
  query: {
    date?: string | string[];
    professional?: string | string[];
    service?: string | string[];
    time?: string | string[];
    booked?: string | string[];
    cancelled?: string | string[];
    rescheduled?: string | string[];
    noShow?: string | string[];
    completed?: string | string[];
  },
) {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const catalog = await listAgendaCatalog(actor);
  const today = zonedCivilNow(ctx.tenant.timezone, new Date()).localDate;
  const date = readQueryValue(query.date) || today;
  const professionalId = readQueryValue(query.professional) || catalog.professionals[0]?.id || "";
  const selectedProfessional = catalog.professionals.find((item) => item.id === professionalId);
  const serviceId =
    readQueryValue(query.service) ||
    preferredServiceId(selectedProfessional?.serviceIds ?? [], catalog.services);
  const requestedTime = readQueryValue(query.time);
  const selectedTime = isLocalTime(requestedTime) ? requestedTime : "";

  let slots: string[] = [];
  let appointments: Awaited<ReturnType<typeof listDayAppointments>> = [];
  let error: string | undefined;
  let emptyReason: ReturnType<typeof emptySlotsReason> = null;
  const now = new Date();
  if (professionalId && isLocalDate(date)) {
    appointments = await listDayAppointments({
      actor,
      professionalId,
      localDate: date,
    });
  }
  if (professionalId && serviceId) {
    try {
      slots = await listAvailableSlots({
        actor,
        professionalId,
        serviceId,
        localDate: date,
        now,
      });
      if (slots.length === 0 && isLocalDate(date)) {
        const snapshot = await repo.loadSnapshot(actor.tenantId, professionalId, serviceId, date);
        if (snapshot) {
          emptyReason = emptySlotsReason(snapshot, date, now);
        }
      }
    } catch (caught) {
      if (caught instanceof ForbiddenError) {
        throw caught;
      }
      if (caught instanceof BookingError && caught.code === "NOT_FOUND") {
        error = "No encontramos ese profesional o servicio.";
      } else if (caught instanceof BookingError) {
        error = validationMessage(caught.reason);
      } else {
        throw caught;
      }
    }
  }

  return {
    tenantName: ctx.tenant.name,
    timezone: ctx.tenant.timezone,
    today,
    date,
    professionalId,
    serviceId,
    selectedTime,
    booked: readQueryValue(query.booked) === "1",
    cancelled: readQueryValue(query.cancelled) === "1",
    rescheduled: readQueryValue(query.rescheduled) === "1",
    noShow: readQueryValue(query.noShow) === "1",
    completed: readQueryValue(query.completed) === "1",
    canWrite: hasPermission(actor.role, "booking.write"),
    professionals: catalog.professionals,
    services: catalog.services,
    catalogEmptyReason: catalogEmptyReason(catalog),
    appointments,
    slots,
    emptyReason,
    nextDay: addLocalDays(today, 1),
    error,
  };
}

export async function createAppointmentAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const date = readString(formData, "date");
  const professionalId = readString(formData, "professionalId");
  const serviceId = readString(formData, "serviceId");
  const localTime = readString(formData, "time");

  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    const client = await findOrCreateClient({
      actor,
      phone: readString(formData, "phone"),
      firstName: readOptionalString(formData, "firstName"),
    });
    await createAppointment({
      actor,
      professionalId,
      serviceId,
      clientId: client.id,
      localDate: date,
      localTime,
      now: new Date(),
    });
    revalidatePath(`/${slug}/agenda`);
    revalidatePath(`/${slug}/agenda/nuevo`);
    redirect(agendaHomeHref(slug, { date, booked: true }) as never);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: "No tenés permiso para esta acción." };
    }
    if (error instanceof ClientsError) {
      return { ok: false, message: clientsValidationMessage(error.reason) };
    }
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      return { ok: false, message: "No encontramos ese profesional o servicio." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: validationMessage(error.reason) };
    }
    throw error;
  }
}

export async function cancelAppointmentAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const date = readString(formData, "date");

  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    await cancelAppointment({
      actor,
      appointmentId: readString(formData, "appointmentId"),
    });
    revalidatePath(`/${slug}/agenda`);
    revalidatePath(`/${slug}/agenda/nuevo`);
    redirect(agendaHomeHref(slug, { date, cancelled: true }) as never);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: "No tenés permiso para esta acción." };
    }
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      return { ok: false, message: "No encontramos ese turno." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: validationMessage(error.reason) };
    }
    throw error;
  }
}

export async function markNoShowAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const date = readString(formData, "date");

  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    await markNoShow({
      actor,
      appointmentId: readString(formData, "appointmentId"),
    });
    revalidatePath(`/${slug}/agenda`);
    revalidatePath(`/${slug}/agenda/nuevo`);
    redirect(agendaHomeHref(slug, { date, noShow: true }) as never);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: "No tenés permiso para esta acción." };
    }
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      return { ok: false, message: "No encontramos ese turno." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: validationMessage(error.reason) };
    }
    throw error;
  }
}

export async function markCompletedAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const date = readString(formData, "date");

  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    await markCompleted({
      actor,
      appointmentId: readString(formData, "appointmentId"),
    });
    revalidatePath(`/${slug}/agenda`);
    revalidatePath(`/${slug}/agenda/nuevo`);
    redirect(agendaHomeHref(slug, { date, completed: true }) as never);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: "No tenés permiso para esta acción." };
    }
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      return { ok: false, message: "No encontramos ese turno." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: validationMessage(error.reason) };
    }
    throw error;
  }
}

export async function loadReschedulePage(slug: string, appointmentId: string) {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const appointment = await getAppointment({ actor, appointmentId });
  const catalog = await listAgendaCatalog(actor);
  const professionals = catalog.professionals.filter((professional) =>
    professional.serviceIds.includes(appointment.serviceId),
  );
  const movable = canRescheduleAppointment(appointment.status);

  return {
    tenantName: ctx.tenant.name,
    today: zonedCivilNow(ctx.tenant.timezone, new Date()).localDate,
    appointment: {
      ...appointment,
      endTime: occupancyEndTime(appointment.localTime, appointment.durationMinutes),
      movable,
    },
    canWrite: hasPermission(actor.role, "booking.write"),
    professionals,
  };
}

export type RescheduleProfessionalsPayload = {
  professionals: { id: string; displayName: string }[];
  emptyReason: ReturnType<typeof emptySlotsReason>;
  branchName: string | null;
  error?: string;
};

export async function fetchRescheduleProfessionalsAction(
  slug: string,
  appointmentId: string,
  localDate: string,
): Promise<RescheduleProfessionalsPayload> {
  if (!isLocalDate(localDate)) {
    return { professionals: [], emptyReason: null, branchName: null, error: "Revisá el día." };
  }

  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    const result = await listRescheduleProfessionals({
      actor,
      appointmentId,
      localDate,
      now: new Date(),
    });
    return {
      professionals: result.professionals,
      emptyReason: result.emptyReason,
      branchName: result.branchName,
    };
  } catch (caught) {
    if (caught instanceof ForbiddenError) {
      throw caught;
    }
    if (caught instanceof BookingError && caught.code === "NOT_FOUND") {
      return {
        professionals: [],
        emptyReason: null,
        branchName: null,
        error: "No encontramos ese turno.",
      };
    }
    if (caught instanceof BookingError) {
      return {
        professionals: [],
        emptyReason: null,
        branchName: null,
        error: validationMessage(caught.reason),
      };
    }
    throw caught;
  }
}

export async function fetchRescheduleSlotsAction(
  slug: string,
  appointmentId: string,
  professionalId: string,
  localDate: string,
): Promise<AvailableSlotsPayload> {
  const ctx = await resolveTenantContext(slug);
  const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
  const now = new Date();

  if (!professionalId || !isLocalDate(localDate)) {
    return { slots: [], emptyReason: null, error: "Revisá el profesional y el día." };
  }

  try {
    const appointment = await getAppointment({ actor, appointmentId });
    if (!canRescheduleAppointment(appointment.status)) {
      return {
        slots: [],
        emptyReason: null,
        error: validationMessage("NOT_MOVABLE"),
      };
    }

    let slots = await listAvailableSlots({
      actor,
      professionalId,
      serviceId: appointment.serviceId,
      localDate,
      now,
      excludeAppointmentId: appointment.id,
    });
    if (professionalId === appointment.professionalId && localDate === appointment.localDate) {
      slots = slots.filter((slot) => slot !== appointment.localTime);
    }
    if (slots.length > 0) {
      return { slots, emptyReason: null };
    }

    const snapshot = await repo.loadSnapshot(
      actor.tenantId,
      professionalId,
      appointment.serviceId,
      localDate,
    );
    return {
      slots: [],
      emptyReason: snapshot ? emptySlotsReason(snapshot, localDate, now) : null,
    };
  } catch (caught) {
    if (caught instanceof ForbiddenError) {
      throw caught;
    }
    if (caught instanceof BookingError && caught.code === "NOT_FOUND") {
      return { slots: [], emptyReason: null, error: "No encontramos ese turno o profesional." };
    }
    if (caught instanceof BookingError) {
      return { slots: [], emptyReason: null, error: validationMessage(caught.reason) };
    }
    throw caught;
  }
}

export async function rescheduleAppointmentAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const slug = readString(formData, "slug");
  const appointmentId = readString(formData, "appointmentId");

  let moved;
  try {
    const ctx = await resolveTenantContext(slug);
    const actor = { tenantId: ctx.tenant.id, role: ctx.membership.role };
    moved = await rescheduleAppointment({
      actor,
      appointmentId,
      professionalId: readString(formData, "professionalId"),
      localDate: readString(formData, "date"),
      localTime: readString(formData, "time"),
      now: new Date(),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: "No tenés permiso para esta acción." };
    }
    if (error instanceof BookingError && error.code === "NOT_FOUND") {
      return { ok: false, message: "No encontramos ese turno." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: validationMessage(error.reason) };
    }
    throw error;
  }

  revalidatePath(`/${slug}/agenda`);
  revalidatePath(`/${slug}/agenda/nuevo`);
  revalidatePath(`/${slug}/agenda/${appointmentId}/reprogramar`);
  redirect(agendaHomeHref(slug, { date: moved.localDate, rescheduled: true }) as never);
}

function catalogEmptyReason(catalog: {
  professionals: { id: string }[];
  services: { id: string }[];
  inactiveProfessionalCount: number;
  inactiveServiceCount: number;
}): string | null {
  if (catalog.professionals.length > 0 && catalog.services.length > 0) {
    return null;
  }
  if (catalog.professionals.length === 0 && catalog.inactiveProfessionalCount > 0) {
    return "Hay profesionales inactivos. En Equipo, activá al menos uno para ver huecos.";
  }
  if (catalog.services.length === 0 && catalog.inactiveServiceCount > 0) {
    return "Hay servicios inactivos. En Servicios, activá al menos uno para ver huecos.";
  }
  return "Falta un profesional o un servicio para calcular huecos.";
}
