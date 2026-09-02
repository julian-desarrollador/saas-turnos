-- CreateIndex
CREATE INDEX "appointments_tenant_id_local_date_idx" ON "appointments"("tenant_id", "local_date");
