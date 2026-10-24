import { notFound } from "next/navigation";

import { publicTheme as t } from "@/components/shared/public-template";
import { isTenantSlug } from "@/core/tenant-slug";
import { PublicBookingWizard } from "@/modules/booking/components/public-booking-wizard";
import { loadPublicBooking } from "@/modules/booking/adapters/inbound/public-actions";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";

export default async function PublicBookingPage({
  params,
  searchParams,
}: PageProps<"/[slug]/reservar">) {
  const { slug } = await params;
  const query = await searchParams;
  const servicio = typeof query.servicio === "string" ? query.servicio : "";
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadPublicBooking(slug);
  const site = await loadPublicSiteBySlug(slug);
  if (!loaded || !site) {
    notFound();
  }
  if (!loaded.catalog) {
    return (
      <main className="flex min-h-[70svh] flex-col justify-center px-6 text-center">
        <h1 className={`text-3xl ${t.display}`}>{loaded.tenant.name}</h1>
        <p className={`mt-3 text-sm ${t.muted}`}>
          Este negocio no está recibiendo reservas online.
        </p>
      </main>
    );
  }
  return (
    <PublicBookingWizard
      slug={loaded.tenant.slug}
      businessName={loaded.tenant.name}
      catalog={loaded.catalog}
      whatsappPhone={loaded.whatsappPhone}
      address={site.site.published ? site.site.address : null}
      accent={site.accent}
      initialServiceId={servicio}
    />
  );
}
