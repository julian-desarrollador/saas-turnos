import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicTheme as t } from "@/components/shared/public-template";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";
import {
  PublicCover,
  PublicSiteTemplate,
} from "@/modules/tenant-config/components/public-site-template";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadPublicSiteBySlug(slug);
  if (!loaded) {
    return { title: "Negocio" };
  }
  const description =
    loaded.site.published && loaded.site.headline
      ? loaded.site.headline
      : `Reservá un turno en ${loaded.site.name}`;
  const image = loaded.images.cover ?? loaded.images.logo;
  return {
    title: loaded.site.name,
    description,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function PublicSitePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const loaded = await loadPublicSiteBySlug(slug);
  if (!loaded) {
    notFound();
  }
  const { site, images } = loaded;
  if (!site.published) {
    return (
      <div className={t.page}>
        <PublicCover name={site.name} headline="" logo={images.logo} cover={null} />
        <div className="grid gap-3 px-6 py-8">
          {loaded.access === "full" ? (
            <a href={`/${loaded.slug}/reservar`} className={t.primary}>
              Reservar turno
            </a>
          ) : (
            <p className={`text-sm ${t.muted}`}>Este negocio no está recibiendo reservas online.</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <PublicSiteTemplate
      slug={loaded.slug}
      accent={loaded.accent}
      content={{
        name: site.name,
        headline: site.headline,
        about: site.about,
        instagram: site.instagram,
        phone: site.phone,
        address: site.address,
        hours: site.hours,
        services: site.services,
        images,
        showReserve: loaded.access === "full",
      }}
    />
  );
}
