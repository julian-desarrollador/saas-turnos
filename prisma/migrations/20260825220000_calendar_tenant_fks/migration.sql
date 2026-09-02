-- DropForeignKey
ALTER TABLE "calendar_blocks" DROP CONSTRAINT "calendar_blocks_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_blocks" DROP CONSTRAINT "calendar_blocks_professional_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_exceptions" DROP CONSTRAINT "calendar_exceptions_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_exceptions" DROP CONSTRAINT "calendar_exceptions_professional_id_fkey";

-- DropForeignKey
ALTER TABLE "weekly_schedules" DROP CONSTRAINT "weekly_schedules_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "weekly_schedules" DROP CONSTRAINT "weekly_schedules_professional_id_fkey";

-- AddForeignKey
ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_tenant_id_branch_id_fkey" FOREIGN KEY ("tenant_id", "branch_id") REFERENCES "branches"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_tenant_id_professional_id_fkey" FOREIGN KEY ("tenant_id", "professional_id") REFERENCES "professionals"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_exceptions" ADD CONSTRAINT "calendar_exceptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_exceptions" ADD CONSTRAINT "calendar_exceptions_tenant_id_branch_id_fkey" FOREIGN KEY ("tenant_id", "branch_id") REFERENCES "branches"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_exceptions" ADD CONSTRAINT "calendar_exceptions_tenant_id_professional_id_fkey" FOREIGN KEY ("tenant_id", "professional_id") REFERENCES "professionals"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_tenant_id_branch_id_fkey" FOREIGN KEY ("tenant_id", "branch_id") REFERENCES "branches"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_tenant_id_professional_id_fkey" FOREIGN KEY ("tenant_id", "professional_id") REFERENCES "professionals"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_owner_xor" CHECK (("branch_id" IS NULL) <> ("professional_id" IS NULL));

ALTER TABLE "calendar_exceptions" ADD CONSTRAINT "calendar_exceptions_owner_xor" CHECK (("branch_id" IS NULL) <> ("professional_id" IS NULL));

ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_owner_xor" CHECK (("branch_id" IS NULL) <> ("professional_id" IS NULL));
