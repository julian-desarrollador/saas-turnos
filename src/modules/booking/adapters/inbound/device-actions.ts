"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createPrismaAvailabilityRepository } from "@/modules/booking/adapters/outbound/prisma-availability-repository";
import { BookingError } from "@/modules/booking/application/errors";
import { createCancelDeviceAppointment } from "@/modules/booking/application/use-cases/cancel-device-appointment";
import { createListDeviceAppointments } from "@/modules/booking/application/use-cases/list-device-appointments";
import { createRescheduleDeviceAppointment } from "@/modules/booking/application/use-cases/reschedule-device-appointment";
import { localDateTimeToUtc } from "@/modules/booking/domain/time";
import { findPublicTenant } from "@/server/public-tenant";
import { allowPublicBooking } from "@/server/public-rate-limit";
import { clearDeviceToken, readDeviceHash } from "@/server/public-device";
import { db, tenantDb } from "@/server/db";
import { cancelBookingNotice, scheduleBookingNotice } from "@/server/notices";

const repo = createPrismaAvailabilityRepository(db, tenantDb);
const listAppointments = createListDeviceAppointments(repo);
const cancelAppointment = createCancelDeviceAppointment(repo);
const rescheduleAppointment = createRescheduleDeviceAppointment(repo);

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function openTenant(slug: string) {
  const tenant = await findPublicTenant(slug);
  if (!tenant || tenant.access === "blocked") {
    return null;
  }
  return tenant;
}

export async function loadDeviceAppointments(slug: string) {
  const tenant = await openTenant(slug);
  if (!tenant) {
    return null;
  }
  const deviceKey = await readDeviceHash();
  const listed = deviceKey
    ? await listAppointments({ tenantId: tenant.id, deviceKey, now: new Date() })
    : { upcoming: [], past: [] };
  return {
    slug: tenant.slug,
    access: tenant.access,
    timezone: tenant.timezone,
    upcoming: listed.upcoming,
    past: listed.past,
  };
}

export async function forgetDeviceAction(slug: string): Promise<void> {
  await clearDeviceToken(slug);
  revalidatePath(`/${slug}/perfil`);
  revalidatePath(`/${slug}/perfil/turnos`);
}

export async function cancelDeviceAppointmentAction(
  slug: string,
  appointmentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenant = await openTenant(slug);
  const deviceKey = await readDeviceHash();
  if (!tenant || !deviceKey) {
    return { ok: false, message: "No encontramos ese turno." };
  }
  const allowed = await allowPublicBooking({ ip: await clientIp(), tenantId: tenant.id });
  if (!allowed) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en un rato." };
  }
  try {
    await cancelAppointment({ tenantId: tenant.id, deviceKey, appointmentId, now: new Date() });
  } catch (error) {
    if (error instanceof BookingError) {
      return {
        ok: false,
        message:
          error.reason === "NOT_CANCELLABLE"
            ? "Ese turno ya no se puede cancelar."
            : "No encontramos ese turno.",
      };
    }
    throw error;
  }
  await cancelBookingNotice(tenant.id, appointmentId);
  revalidatePath(`/${slug}/perfil/turnos`);
  return { ok: true };
}

export async function rescheduleDeviceAppointmentAction(input: {
  slug: string;
  appointmentId: string;
  professionalId: string | null;
  localDate: string;
  localTime: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenant = await openTenant(input.slug);
  const deviceKey = await readDeviceHash();
  if (!tenant || tenant.access !== "full" || !deviceKey) {
    return { ok: false, message: "Este negocio no está recibiendo cambios de horario." };
  }
  const allowed = await allowPublicBooking({ ip: await clientIp(), tenantId: tenant.id });
  if (!allowed) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en un rato." };
  }
  const current = (
    await listAppointments({ tenantId: tenant.id, deviceKey, now: new Date() })
  ).upcoming.find((appointment) => appointment.id === input.appointmentId);
  if (!current) {
    return { ok: false, message: "No encontramos ese turno." };
  }
  let moved;
  try {
    moved = await rescheduleAppointment({
      tenantId: tenant.id,
      deviceKey,
      appointmentId: input.appointmentId,
      professionalId: input.professionalId,
      localDate: input.localDate,
      localTime: input.localTime,
      now: new Date(),
    });
  } catch (error) {
    if (error instanceof BookingError && error.reason === "NO_CHANGE") {
      return { ok: false, message: "Elegí otro horario." };
    }
    if (error instanceof BookingError) {
      return { ok: false, message: "Ese horario ya no está disponible." };
    }
    throw error;
  }
  await cancelBookingNotice(tenant.id, input.appointmentId);
  await scheduleBookingNotice({
    tenantId: tenant.id,
    appointmentId: moved.id,
    startsAt: localDateTimeToUtc(moved.localDate, moved.localTime, tenant.timezone),
    localDate: moved.localDate,
    localTime: moved.localTime,
    phone: current.clientPhone,
    businessName: tenant.name,
    serviceName: current.serviceName,
    now: new Date(),
  });
  revalidatePath(`/${input.slug}/perfil/turnos`);
  return { ok: true };
}
