import { notFound } from "next/navigation";

import { publicTheme as t } from "@/components/shared/public-template";
import { isTenantSlug } from "@/core/tenant-slug";
import { loadDeviceAppointments } from "@/modules/booking/adapters/inbound/device-actions";
import { DeviceReschedule } from "@/modules/booking/components/device-reschedule";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";

export default async function ChangeDeviceTurnPage({
  params,
}: PageProps<"/[slug]/perfil/turnos/[appointmentId]/cambiar">) {
  const { slug, appointmentId } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadDeviceAppointments(slug);
  const site = await loadPublicSiteBySlug(slug);
  if (!loaded || !site) {
    notFound();
  }
  const appointment = [...loaded.upcoming, ...loaded.past].find(
    (item) => item.id === appointmentId,
  );
  if (!appointment) {
    notFound();
  }
  if (loaded.access !== "full") {
    return (
      <div className="px-6 py-10">
        <h1 className={`text-4xl ${t.display}`}>Cambiar horario</h1>
        <p className={`mt-3 text-sm ${t.muted}`}>
          Este negocio no está recibiendo cambios de horario. Podés cancelar el turno.
        </p>
      </div>
    );
  }
  return (
    <DeviceReschedule
      slug={loaded.slug}
      accent={site.accent}
      appointmentId={appointment.id}
      serviceId={appointment.serviceId}
      serviceName={appointment.serviceName}
      professionalId={appointment.professionalId}
      professionalName={appointment.professionalName}
    />
  );
}
