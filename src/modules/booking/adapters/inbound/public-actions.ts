"use server";

import { headers } from "next/headers";

import { createPrismaAvailabilityRepository } from "@/modules/booking/adapters/outbound/prisma-availability-repository";
import { createPrismaPublicClients } from "@/modules/booking/adapters/outbound/prisma-public-clients";
import { BookingError } from "@/modules/booking/application/errors";
import { createListPublicDays } from "@/modules/booking/application/use-cases/list-public-days";
import {
  createListPublicCatalog,
  createListPublicSlots,
} from "@/modules/booking/application/use-cases/list-public-slots";
import { createPublicReservation } from "@/modules/booking/application/use-cases/public-reservation";
import { ensureDeviceToken } from "@/server/public-device";
import { findPublicTenant } from "@/server/public-tenant";
import { allowPublicBooking } from "@/server/public-rate-limit";
import { db, tenantDb } from "@/server/db";
import { scheduleBookingNotice } from "@/server/notices";
import { localDateTimeToUtc } from "@/modules/booking/domain/time";

const repo = createPrismaAvailabilityRepository(db, tenantDb);
const listCatalog = createListPublicCatalog(repo);
const listSlots = createListPublicSlots(repo);
const listDays = createListPublicDays(repo);
const reserve = createPublicReservation(repo, createPrismaPublicClients(db, tenantDb));

export type PublicCatalog = Awaited<ReturnType<typeof listCatalog>>;

async function openTenant(slug: string) {
  const tenant = await findPublicTenant(slug);
  if (!tenant || tenant.access !== "full") {
    return null;
  }
  return tenant;
}

export async function loadPublicServices(slug: string) {
  const tenant = await findPublicTenant(slug);
  if (!tenant || tenant.access === "blocked") {
    return null;
  }
  const catalog = await listCatalog(tenant.id);
  return {
    slug: tenant.slug,
    services: catalog.services,
    canReserve: tenant.access === "full",
  };
}

export async function loadPublicBooking(slug: string) {
  const tenant = await findPublicTenant(slug);
  if (!tenant) {
    return null;
  }
  if (tenant.access !== "full") {
    return { tenant, catalog: null, whatsappPhone: null };
  }
  const catalog = await listCatalog(tenant.id);
  const branch = await db.branch.findFirst({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { phone: true },
  });
  return { tenant, catalog, whatsappPhone: branch?.phone ?? null };
}

export async function fetchPublicDaysAction(input: {
  slug: string;
  serviceId: string;
  professionalId: string | null;
}): Promise<{ days: string[] }> {
  const tenant = await openTenant(input.slug);
  if (!tenant) {
    return { days: [] };
  }
  return {
    days: await listDays({
      tenantId: tenant.id,
      serviceId: input.serviceId,
      professionalId: input.professionalId,
      now: new Date(),
    }),
  };
}

export async function fetchPublicSlotsAction(input: {
  slug: string;
  professionalId: string | null;
  serviceId: string;
  localDate: string;
}): Promise<{ slots: string[] }> {
  const tenant = await openTenant(input.slug);
  if (!tenant) {
    return { slots: [] };
  }
  try {
    const slots = await listSlots({
      tenantId: tenant.id,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      localDate: input.localDate,
      now: new Date(),
    });
    return { slots };
  } catch (error) {
    if (error instanceof BookingError) {
      return { slots: [] };
    }
    throw error;
  }
}

export type PublicBookingState = {
  ok: boolean;
  message?: string;
  localDate?: string;
  localTime?: string;
  professionalName?: string;
  serviceName?: string;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

export async function confirmPublicReservationAction(
  _prev: PublicBookingState | undefined,
  formData: FormData,
): Promise<PublicBookingState> {
  const slug = readString(formData, "slug");
  const tenant = await openTenant(slug);
  if (!tenant) {
    return { ok: false, message: "Este negocio no está recibiendo reservas." };
  }
  const allowed = await allowPublicBooking({ ip: await clientIp(), tenantId: tenant.id });
  if (!allowed) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en un rato." };
  }
  const result = await reserve({
    tenantId: tenant.id,
    professionalId: readString(formData, "professionalId") || null,
    serviceId: readString(formData, "serviceId"),
    localDate: readString(formData, "date"),
    localTime: readString(formData, "time"),
    phone: readString(formData, "phone"),
    firstName: readString(formData, "firstName"),
    whatsappConsent: formData.get("whatsappConsent") === "on",
    now: new Date(),
    publicDeviceHash: await ensureDeviceToken(slug),
  });
  if (result.status === "confirmed") {
    await scheduleBookingNotice({
      tenantId: tenant.id,
      appointmentId: result.appointmentId,
      startsAt: localDateTimeToUtc(result.localDate, result.localTime, tenant.timezone),
      localDate: result.localDate,
      localTime: result.localTime,
      phone: readString(formData, "phone"),
      businessName: tenant.name,
      serviceName: result.serviceName || "Turno",
      now: new Date(),
    });
    return {
      ok: true,
      localDate: result.localDate,
      localTime: result.localTime,
      professionalName: result.professionalName,
      serviceName: result.serviceName,
    };
  }
  if (result.status === "invalid") {
    return {
      ok: false,
      message: "Revisá el nombre, el teléfono, el horario y el aviso de WhatsApp.",
    };
  }
  return { ok: false, message: "Ese horario ya no está disponible." };
}
