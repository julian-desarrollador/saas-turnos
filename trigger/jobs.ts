import { schedules } from "@trigger.dev/sdk";

async function postJob(path: string): Promise<void> {
  const base = process.env["APP_URL"];
  const secret = process.env["CRON_SECRET"];
  if (!base || !secret) {
    throw new Error("NOT_CONFIGURED");
  }
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    throw new Error(`JOB_FAILED_${response.status}`);
  }
}

export const dispatchNotifications = schedules.task({
  id: "dispatch-notifications",
  cron: "*/15 * * * *",
  run: async () => {
    await postJob("/api/jobs/dispatch-notifications");
  },
});

export const reconcileSubscriptions = schedules.task({
  id: "reconcile-subscriptions",
  cron: { pattern: "0 8 * * *", timezone: "America/Argentina/Buenos_Aires" },
  run: async () => {
    await postJob("/api/jobs/reconcile-subscriptions");
  },
});
