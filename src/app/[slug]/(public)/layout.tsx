import { notFound } from "next/navigation";

import { publicFonts } from "@/components/shared/public-fonts";
import { publicTheme } from "@/components/shared/public-template";
import { isTenantSlug } from "@/core/tenant-slug";
import { loadPublicSiteBySlug } from "@/modules/tenant-config/adapters/inbound/public-site";
import { PublicBottomNav } from "@/modules/tenant-config/components/public-bottom-nav";

export default async function PublicBusinessLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const loaded = await loadPublicSiteBySlug(slug);
  if (!loaded) {
    notFound();
  }
  return (
    <div
      className={`${publicFonts} ${publicTheme.page} min-h-svh font-[family-name:var(--font-public-body)]`}
    >
      <div className="mx-auto min-h-svh max-w-md pb-24">{children}</div>
      <PublicBottomNav slug={loaded.slug} accent={loaded.accent} />
    </div>
  );
}
