"use client";

import { FeedbackToast } from "@/components/shared/feedback-toast";

const MEMBERS_QUERY_KEYS = ["invited", "who"] as const;

export function MembersFeedbackToast({ message }: { message: string | null }) {
  return <FeedbackToast message={message} queryKeys={MEMBERS_QUERY_KEYS} />;
}
