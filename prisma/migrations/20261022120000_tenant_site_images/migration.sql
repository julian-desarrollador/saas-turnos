ALTER TABLE "tenant_sites" ADD COLUMN "logo_key" VARCHAR(200);
ALTER TABLE "tenant_sites" ADD COLUMN "cover_key" VARCHAR(200);

CREATE TABLE "tenant_site_photos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "key" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_site_photos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_site_photos_tenant_id_key_key" ON "tenant_site_photos"("tenant_id", "key");
CREATE INDEX "tenant_site_photos_tenant_id_position_idx" ON "tenant_site_photos"("tenant_id", "position");

ALTER TABLE "tenant_site_photos" ADD CONSTRAINT "tenant_site_photos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_site_photos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tenant_site_photos" USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant_site_photos" TO saas_app;
