import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env/server";
import { dispatchDueNotices } from "@/server/notices";

export async function POST(request: Request) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await dispatchDueNotices(new Date());
  return NextResponse.json({ sent });
}
