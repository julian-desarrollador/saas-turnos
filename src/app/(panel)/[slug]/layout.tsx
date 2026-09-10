import { UserButton } from "@clerk/nextjs";

import { hasPermission } from "@/core/authorization";
import { membershipRoleLabel } from "@/core/membership";
import { resolveTenantContext } from "@/server/auth";

import { PanelBottomNav } from "./panel-bottom-nav";

export default async function TenantLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const ctx = await resolveTenantContext(slug);
  const showMembers = hasPermission(ctx.membership.role, "members.read");

  return (
    <div data-tenant={ctx.tenant.slug}>
      <header className="border-border bg-background sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b px-4 py-2 md:px-6">
        <span className="truncate text-lg font-semibold">{ctx.tenant.name}</span>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {ctx.user.firstName ?? "Usuario"} — {membershipRoleLabel(ctx.membership.role)}
          </span>
          <span className="text-muted-foreground text-sm sm:hidden">
            {membershipRoleLabel(ctx.membership.role)}
          </span>
          <UserButton />
        </div>
      </header>
      <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <PanelBottomNav slug={ctx.tenant.slug} showMembers={showMembers} />
    </div>
  );
}
