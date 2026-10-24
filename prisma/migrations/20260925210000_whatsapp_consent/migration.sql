-- Fecha del consentimiento de WhatsApp en la reserva pública.

ALTER TABLE "clients" ADD COLUMN "whatsapp_consent_at" TIMESTAMPTZ;
