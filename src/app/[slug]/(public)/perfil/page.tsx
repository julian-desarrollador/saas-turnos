import { notFound } from "next/navigation";

import { isTenantSlug } from "@/core/tenant-slug";
import { PublicProfileScreen } from "@/modules/booking/components/public-profile-screen";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";

export default async function PublicProfilePage({ params }: PageProps<"/[slug]/perfil">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadPublicSiteBySlug(slug);
  if (!loaded) {
    notFound();
  }
  const contact = loaded.site.published
    ? {
        phone: loaded.site.phone,
        address: loaded.site.address,
        instagram: loaded.site.instagram,
      }
    : { phone: null, address: null, instagram: null };
  return (
    <PublicProfileScreen
      slug={loaded.slug}
      businessName={loaded.site.name}
      accent={loaded.accent}
      {...contact}
    />
  );
}
