"use client";

import { FeedbackToast } from "@/components/shared/feedback-toast";

const SCHEDULE_QUERY_KEYS = ["saved", "who"] as const;

export function ScheduleFeedbackToast({ message }: { message: string | null }) {
  return <FeedbackToast message={message} queryKeys={SCHEDULE_QUERY_KEYS} />;
}
