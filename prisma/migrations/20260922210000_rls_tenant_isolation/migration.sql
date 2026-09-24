-- ADR-022. El rol saas_app se crea antes, con prisma/scripts/create-saas-app-role.sql,
-- porque CREATE ROLE no puede correr dentro de la transacción de esta migración.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'saas_app') THEN
    RAISE EXCEPTION 'Falta el rol saas_app. Ejecutá prisma/scripts/create-saas-app-role.sql con DIRECT_URL antes de esta migración.';
  END IF;
END
$$;

-- CreateIndex
CREATE UNIQUE INDEX "services_tenant_id_id_key" ON "services"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_tenant_id_id_key" ON "appointments"("tenant_id", "id");

-- AlterTable
ALTER TABLE "professional_services" ADD COLUMN "tenant_id" UUID;

-- AlterTable
ALTER TABLE "appointment_services" ADD COLUMN "tenant_id" UUID;

UPDATE "professional_services" AS link
SET "tenant_id" = professional."tenant_id"
FROM "professionals" AS professional
WHERE professional."id" = link."professional_id";

UPDATE "appointment_services" AS link
SET "tenant_id" = appointment."tenant_id"
FROM "appointments" AS appointment
WHERE appointment."id" = link."appointment_id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "professional_services" AS link
    JOIN "professionals" AS professional ON professional."id" = link."professional_id"
    JOIN "services" AS service ON service."id" = link."service_id"
    WHERE professional."tenant_id" <> service."tenant_id"
       OR link."tenant_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'professional_services mezcla negocios o no pudo copiar tenant_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "appointment_services" AS link
    JOIN "appointments" AS appointment ON appointment."id" = link."appointment_id"
    JOIN "services" AS service ON service."id" = link."service_id"
    WHERE appointment."tenant_id" <> service."tenant_id"
       OR link."tenant_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'appointment_services mezcla negocios o no pudo copiar tenant_id';
  END IF;
END
$$;

ALTER TABLE "professional_services" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "appointment_services" ALTER COLUMN "tenant_id" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "professional_services" DROP CONSTRAINT "professional_services_professional_id_fkey";
ALTER TABLE "professional_services" DROP CONSTRAINT "professional_services_service_id_fkey";
ALTER TABLE "appointment_services" DROP CONSTRAINT "appointment_services_appointment_id_fkey";
ALTER TABLE "appointment_services" DROP CONSTRAINT "appointment_services_service_id_fkey";

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_tenant_id_professional_id_fkey" FOREIGN KEY ("tenant_id", "professional_id") REFERENCES "professionals"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_tenant_id_service_id_fkey" FOREIGN KEY ("tenant_id", "service_id") REFERENCES "services"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_tenant_id_appointment_id_fkey" FOREIGN KEY ("tenant_id", "appointment_id") REFERENCES "appointments"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_tenant_id_service_id_fkey" FOREIGN KEY ("tenant_id", "service_id") REFERENCES "services"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "professional_services_tenant_id_idx" ON "professional_services"("tenant_id");
CREATE INDEX "appointment_services_tenant_id_idx" ON "appointment_services"("tenant_id");

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'branches',
    'professionals',
    'services',
    'professional_services',
    'weekly_schedules',
    'calendar_exceptions',
    'calendar_blocks',
    'clients',
    'appointments',
    'appointment_services',
    'membership_invites'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
      table_name
    );
  END LOOP;
END
$$;

GRANT USAGE ON SCHEMA public TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saas_app;
REVOKE ALL ON TABLE "_prisma_migrations" FROM saas_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;
