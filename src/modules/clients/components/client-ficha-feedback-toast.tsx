"use client";

import { FeedbackToast } from "@/components/shared/feedback-toast";

const FICHA_QUERY_KEYS = ["saved"] as const;

export function ClientFichaFeedbackToast({ message }: { message: string | null }) {
  return <FeedbackToast message={message} queryKeys={FICHA_QUERY_KEYS} />;
}
