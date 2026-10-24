-- Tope mensual de mensajes incluido en el plan (ADR-024).

ALTER TABLE "tenants" ADD COLUMN "message_monthly_cap" INTEGER NOT NULL DEFAULT 300;
