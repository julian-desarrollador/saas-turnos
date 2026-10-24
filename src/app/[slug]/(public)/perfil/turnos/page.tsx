import { notFound } from "next/navigation";

import { isTenantSlug } from "@/core/tenant-slug";
import { loadDeviceAppointments } from "@/modules/booking/adapters/inbound/device-actions";
import { DeviceTurns } from "@/modules/booking/components/device-turns";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";

export default async function DeviceTurnsPage({ params }: PageProps<"/[slug]/perfil/turnos">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadDeviceAppointments(slug);
  const site = await loadPublicSiteBySlug(slug);
  if (!loaded || !site) {
    notFound();
  }
  const card = (appointment: (typeof loaded.upcoming)[number]) => ({
    id: appointment.id,
    localDate: appointment.localDate,
    localTime: appointment.localTime,
    status: appointment.status,
    serviceName: appointment.serviceName,
    professionalName: appointment.professionalName,
  });
  return (
    <DeviceTurns
      slug={loaded.slug}
      accent={site.accent}
      canReschedule={loaded.access === "full"}
      upcoming={loaded.upcoming.map(card)}
      past={loaded.past.map(card)}
    />
  );
}
