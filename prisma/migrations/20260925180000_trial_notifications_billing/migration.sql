-- Alta comercial, recordatorios y idempotencia de cobro.

CREATE TYPE "plan_code" AS ENUM ('INICIO', 'NEGOCIO', 'EQUIPO');
CREATE TYPE "subscription_status" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "notification_kind" AS ENUM ('CONFIRMATION', 'REMINDER');
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');

ALTER TABLE "tenants" ADD COLUMN "plan" "plan_code" NOT NULL DEFAULT 'INICIO';
ALTER TABLE "tenants" ADD COLUMN "subscription_status" "subscription_status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" TIMESTAMPTZ;
ALTER TABLE "tenants" ADD COLUMN "grace_ends_at" TIMESTAMPTZ;
ALTER TABLE "tenants" ADD COLUMN "period_ends_at" TIMESTAMPTZ;
ALTER TABLE "tenants" ADD COLUMN "provider_subscription_id" VARCHAR(255);
ALTER TABLE "tenants" ADD COLUMN "employee_limit" INTEGER NOT NULL DEFAULT 3;

CREATE UNIQUE INDEX "tenants_provider_subscription_id_key" ON "tenants"("provider_subscription_id");

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "send_at" TIMESTAMPTZ NOT NULL,
    "idempotency_key" VARCHAR(200) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" VARCHAR(255),
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_idempotency_key_key" ON "notifications"("idempotency_key");
CREATE INDEX "notifications_status_send_at_idx" ON "notifications"("status", "send_at");
CREATE INDEX "notifications_tenant_id_appointment_id_idx" ON "notifications"("tenant_id", "appointment_id");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_appointment_id_fkey" FOREIGN KEY ("tenant_id", "appointment_id") REFERENCES "appointments"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "notifications" USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Sin tenant_id: la firma del webhook se verifica antes de saber el negocio.
CREATE TABLE "processed_provider_events" (
    "id" VARCHAR(255) NOT NULL,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_provider_events_pkey" PRIMARY KEY ("id")
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "notifications" TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "processed_provider_events" TO saas_app;
