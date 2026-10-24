CREATE TABLE "tenant_sites" (
    "tenant_id" UUID NOT NULL,
    "headline" VARCHAR(120) NOT NULL DEFAULT '',
    "about" VARCHAR(1000) NOT NULL DEFAULT '',
    "brand_color" VARCHAR(20) NOT NULL DEFAULT 'slate',
    "instagram" VARCHAR(30),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tenant_sites_pkey" PRIMARY KEY ("tenant_id")
);

ALTER TABLE "tenant_sites" ADD CONSTRAINT "tenant_sites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_sites" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tenant_sites" USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant_sites" TO saas_app;
