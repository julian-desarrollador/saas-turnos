import "server-only";

import { serverEnv } from "@/lib/env/server";
import type { MessageSender } from "@/modules/notifications/application/ports/notice-store";

const GRAPH_VERSION = "v24.0";

const TEMPLATE: Record<"CONFIRMATION" | "REMINDER", string> = {
  CONFIRMATION: "turno_confirmado",
  REMINDER: "turno_recordatorio",
};

export function createMetaCloudSender(): MessageSender {
  return {
    async send(input) {
      const token = serverEnv.META_WHATSAPP_TOKEN;
      const phoneNumberId = serverEnv.META_WHATSAPP_PHONE_NUMBER_ID;
      if (!token || !phoneNumberId) {
        throw new Error("NOT_CONFIGURED");
      }
      const response = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: input.toPhone.replace(/^\+/, ""),
            type: "template",
            template: {
              name: TEMPLATE[input.kind],
              language: { code: "es_AR" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: input.businessName },
                    { type: "text", text: input.localDate },
                    { type: "text", text: input.localTime },
                    { type: "text", text: input.serviceName },
                    { type: "text", text: input.businessPhone },
                  ],
                },
              ],
            },
          }),
        },
      );
      if (!response.ok) {
        throw new Error("SEND_FAILED");
      }
      const body = (await response.json()) as { messages?: { id?: string }[] };
      return { providerMessageId: body.messages?.[0]?.id ?? "sent" };
    },
  };
}
