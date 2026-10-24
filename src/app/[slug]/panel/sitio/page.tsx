import { notFound } from "next/navigation";

import { hasPermission } from "@/core/authorization";
import { isTenantSlug } from "@/core/tenant-slug";
import { SiteEditorForm } from "@/modules/tenant-config/components/site-editor-form";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import { loadSiteEditor } from "@/modules/tenant-config/adapters/inbound/site-actions";
import { resolveTenantContext } from "@/server/auth";

export default async function SiteEditorPage({ params }: PageProps<"/[slug]/panel/sitio">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const ctx = await resolveTenantContext(slug);
  if (!hasPermission(ctx.membership.role, "site.write")) {
    notFound();
  }
  let editor;
  try {
    editor = await loadSiteEditor(slug);
  } catch (error) {
    if (error instanceof TenantConfigError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  return <SiteEditorForm slug={slug} editor={editor} />;
}
