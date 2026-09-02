-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "clerk_organization_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_clerk_organization_id_key" ON "tenants"("clerk_organization_id");

-- CreateEnum
CREATE TYPE "membership_invite_status" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "membership_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "membership_role" NOT NULL,
    "status" "membership_invite_status" NOT NULL DEFAULT 'PENDING',
    "clerk_invitation_id" VARCHAR(255),
    "invited_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "membership_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_invites_clerk_invitation_id_key" ON "membership_invites"("clerk_invitation_id");

-- CreateIndex
CREATE INDEX "membership_invites_tenant_id_email_status_idx" ON "membership_invites"("tenant_id", "email", "status");

-- AddForeignKey
ALTER TABLE "membership_invites" ADD CONSTRAINT "membership_invites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invites" ADD CONSTRAINT "membership_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
