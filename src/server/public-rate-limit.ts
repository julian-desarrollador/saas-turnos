import "server-only";

import { serverEnv } from "@/lib/env/server";

const HOUR_MS = 60 * 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function consumeMemoryBucket(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): boolean {
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
}

async function consumeUpstash(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return consumeMemoryBucket(key, limit, windowSeconds * 1000, Date.now());
  }
  const headers = { Authorization: `Bearer ${token}` };
  const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers,
    cache: "no-store",
  });
  if (!incr.ok) {
    return false;
  }
  const body = (await incr.json()) as { result?: number };
  const count = body.result ?? limit + 1;
  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
      headers,
      cache: "no-store",
    });
  }
  return count <= limit;
}

export async function allowPublicBooking(input: {
  ip: string;
  tenantId: string;
}): Promise<boolean> {
  const ipOk = await consumeUpstash(`book:ip:${input.ip}`, 8, HOUR_MS / 1000);
  const tenantOk = await consumeUpstash(`book:tenant:${input.tenantId}`, 40, HOUR_MS / 1000);
  return ipOk && tenantOk;
}
