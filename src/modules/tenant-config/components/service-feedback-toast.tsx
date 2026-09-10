"use client";

import { FeedbackToast } from "@/components/shared/feedback-toast";

const SERVICE_QUERY_KEYS = ["created", "saved", "activated", "deactivated", "who"] as const;

export function ServiceFeedbackToast({ message }: { message: string | null }) {
  return <FeedbackToast message={message} queryKeys={SERVICE_QUERY_KEYS} />;
}
