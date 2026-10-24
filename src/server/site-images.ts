import "server-only";

import { serverEnv } from "@/lib/env/server";
import type { SiteImageStorage } from "@/modules/tenant-config/application/ports/site-image-storage";
import { createR2SiteImageStorage } from "@/modules/tenant-config/adapters/outbound/r2-site-image-storage";

function createStorage(): SiteImageStorage | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } =
    serverEnv;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET ||
    !R2_PUBLIC_URL
  ) {
    return null;
  }
  return createR2SiteImageStorage({
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
  });
}

/** `null` mientras el bucket no esté conectado: el editor muestra la carga desactivada. */
export const siteImageStorage = createStorage();

export function siteImageUrl(key: string | null): string | null {
  if (!key || !serverEnv.R2_PUBLIC_URL) {
    return null;
  }
  return `${serverEnv.R2_PUBLIC_URL}/${key}`;
}
