ALTER TABLE "appointments" ADD COLUMN "public_device_hash" VARCHAR(64);

CREATE INDEX "appointments_tenant_id_public_device_hash_idx" ON "appointments"("tenant_id", "public_device_hash");
