"use server";

import { revalidatePath } from "next/cache";

import { ForbiddenError } from "@/core/authorization";
import { panelPath } from "@/core/panel-routes";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import { createConfirmSiteImage } from "@/modules/tenant-config/application/use-cases/confirm-site-image";
import { createGetSiteEditor } from "@/modules/tenant-config/application/use-cases/get-site-editor";
import { createRemoveSiteImage } from "@/modules/tenant-config/application/use-cases/remove-site-image";
import { createRequestSiteImageUpload } from "@/modules/tenant-config/application/use-cases/request-site-image-upload";
import { createUpdateSiteProfile } from "@/modules/tenant-config/application/use-cases/update-site-profile";
import { createPrismaSiteStore } from "@/modules/tenant-config/adapters/outbound/prisma-site-store";
import { resolveTenantContext } from "@/server/auth";
import { tenantDb } from "@/server/db";
import { siteImageStorage, siteImageUrl } from "@/server/site-images";

import { validationMessage } from "./messages";

const store = createPrismaSiteStore(tenantDb);

const notConfigured = "La carga de fotos todavía no está conectada.";

export type SiteEditorData = Awaited<ReturnType<ReturnType<typeof createGetSiteEditor>>> & {
  uploadsEnabled: boolean;
  imageUrls: {
    logo: string | null;
    cover: string | null;
    gallery: { key: string; url: string }[];
  };
};

export type SiteActionState = { ok: true } | { error: string } | undefined;

export type SiteImageUpload = { ok: true; key: string; uploadUrl: string } | { error: string };

export async function loadSiteEditor(slug: string): Promise<SiteEditorData> {
  const ctx = await resolveTenantContext(slug);
  const editor = await createGetSiteEditor(store)({
    tenantId: ctx.tenant.id,
    role: ctx.membership.role,
  });
  return {
    ...editor,
    uploadsEnabled: siteImageStorage !== null,
    imageUrls: {
      logo: siteImageUrl(editor.images.logoKey),
      cover: siteImageUrl(editor.images.coverKey),
      gallery: editor.images.photoKeys.flatMap((key) => {
        const url = siteImageUrl(key);
        return url ? [{ key, url }] : [];
      }),
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof TenantConfigError) {
    return error.code === "NOT_FOUND" ? "La foto ya no existe." : validationMessage(error.reason);
  }
  if (error instanceof ForbiddenError) {
    return "No tenés permiso para editar el sitio.";
  }
  throw error;
}

function revalidateSite(slug: string) {
  revalidatePath(`/${slug}`, "layout");
  revalidatePath(panelPath(slug, "sitio"));
}

export async function saveSiteProfileAction(
  slug: string,
  _previous: SiteActionState,
  formData: FormData,
): Promise<SiteActionState> {
  const ctx = await resolveTenantContext(slug);
  const instagram = String(formData.get("instagram") ?? "");
  try {
    await createUpdateSiteProfile(store)({
      actor: { tenantId: ctx.tenant.id, role: ctx.membership.role },
      headline: String(formData.get("headline") ?? ""),
      about: String(formData.get("about") ?? ""),
      brandColor: String(formData.get("brandColor") ?? ""),
      instagram: instagram.trim() ? instagram : null,
      published: formData.get("published") === "on",
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateSite(slug);
  return { ok: true };
}

export async function requestSiteImageUploadAction(
  slug: string,
  input: { kind: string; contentType: string; size: number },
): Promise<SiteImageUpload> {
  if (!siteImageStorage) {
    return { error: notConfigured };
  }
  const ctx = await resolveTenantContext(slug);
  try {
    const upload = await createRequestSiteImageUpload(
      store,
      siteImageStorage,
    )({
      actor: { tenantId: ctx.tenant.id, role: ctx.membership.role },
      kind: String(input.kind),
      contentType: String(input.contentType),
      size: Number(input.size),
    });
    return { ok: true, ...upload };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function confirmSiteImageAction(
  slug: string,
  input: { kind: string; key: string },
): Promise<SiteActionState> {
  if (!siteImageStorage) {
    return { error: notConfigured };
  }
  const ctx = await resolveTenantContext(slug);
  try {
    await createConfirmSiteImage(
      store,
      siteImageStorage,
    )({
      actor: { tenantId: ctx.tenant.id, role: ctx.membership.role },
      kind: String(input.kind),
      key: String(input.key),
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateSite(slug);
  return { ok: true };
}

export async function removeSiteImageAction(
  slug: string,
  input: { kind: string; key?: string },
): Promise<SiteActionState> {
  if (!siteImageStorage) {
    return { error: notConfigured };
  }
  const ctx = await resolveTenantContext(slug);
  try {
    await createRemoveSiteImage(
      store,
      siteImageStorage,
    )({
      actor: { tenantId: ctx.tenant.id, role: ctx.membership.role },
      kind: String(input.kind),
      key: typeof input.key === "string" ? input.key : undefined,
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateSite(slug);
  return { ok: true };
}
