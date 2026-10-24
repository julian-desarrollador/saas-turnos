import { notFound } from "next/navigation";

import {
  formatDuration,
  pesos,
  publicName,
  publicTheme as t,
} from "@/components/shared/public-template";
import { isTenantSlug } from "@/core/tenant-slug";
import { cn } from "@/lib/utils";
import { loadPublicServices } from "@/modules/booking/adapters/inbound/public-actions";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";

export default async function PublicServicesPage({ params }: PageProps<"/[slug]/servicios">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadPublicServices(slug);
  const site = await loadPublicSiteBySlug(slug);
  if (!loaded || !site) {
    notFound();
  }
  return (
    <div className="px-6 py-10">
      <p className={cn(t.eyebrow, site.accent.text)}>{site.site.name}</p>
      <h1 className={cn("mt-2 text-4xl", t.display)}>Servicios</h1>
      {loaded.services.length === 0 ? (
        <p className={cn("mt-6 text-sm", t.muted)}>Todavía no hay servicios publicados.</p>
      ) : (
        <ul className={cn("mt-6 border-t", t.line)}>
          {loaded.services.map((service) => (
            <li key={service.id} className={cn("grid gap-3 border-b py-5", t.line)}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className={cn("text-xl", t.display)}>{publicName(service.name)}</h2>
                <span className="text-sm font-medium">{pesos.format(service.priceAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className={cn("text-xs", t.muted)}>
                  {formatDuration(service.durationMinutes)}
                </span>
                {loaded.canReserve ? (
                  <a href={`/${loaded.slug}/reservar?servicio=${service.id}`} className={t.link}>
                    Reservar
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
