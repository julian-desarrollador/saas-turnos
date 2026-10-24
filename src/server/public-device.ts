import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env/server";

const DEVICE_COOKIE = "turno_device";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function readDeviceHash(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(DEVICE_COOKIE)?.value;
  if (!token || token.length < 32) {
    return null;
  }
  return hashDeviceToken(token);
}

export async function ensureDeviceToken(slug: string): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  const token = existing && existing.length >= 32 ? existing : randomBytes(32).toString("hex");
  if (token !== existing) {
    jar.set(DEVICE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: serverEnv.NODE_ENV === "production",
      path: `/${slug}`,
      maxAge: YEAR_SECONDS,
    });
  }
  return hashDeviceToken(token);
}

export async function clearDeviceToken(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: serverEnv.NODE_ENV === "production",
    path: `/${slug}`,
    maxAge: 0,
  });
}
