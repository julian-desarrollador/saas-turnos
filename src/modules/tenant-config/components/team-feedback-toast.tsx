"use client";

import { FeedbackToast } from "@/components/shared/feedback-toast";

const TEAM_QUERY_KEYS = ["created", "saved", "activated", "deactivated", "who"] as const;

export function TeamFeedbackToast({ message }: { message: string | null }) {
  return <FeedbackToast message={message} queryKeys={TEAM_QUERY_KEYS} />;
}
