import { UserButton } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { panelPath } from "@/core/panel-routes";

import { hasPermission } from "@/core/authorization";
import { membershipRoleLabel } from "@/core/membership";
import { isTenantSlug } from "@/core/tenant-slug";
import { CancelSubscriptionForm } from "@/modules/billing/components/cancel-subscription-form";
import { PaymentOptionsForm } from "@/modules/billing/components/payment-options-form";
import { resolveTenantContext } from "@/server/auth";
import { messageUsage } from "@/server/notices";

import { PanelBottomNav } from "./panel-bottom-nav";

export default async function TenantLayout({ children, params }: LayoutProps<"/[slug]/panel">) {
  const { slug } = await params;
  if (!isTenantSlug(slug)) {
    notFound();
  }
  const ctx = await resolveTenantContext(slug);
  const usage = await messageUsage(ctx.tenant.id, ctx.tenant.timezone);
  const showMembers = hasPermission(ctx.membership.role, "members.read");
  const showSite = hasPermission(ctx.membership.role, "site.write");
  const notice =
    ctx.tenant.access === "blocked"
      ? "La suscripción está cancelada."
      : ctx.tenant.subscriptionStatus === "PAST_DUE"
        ? "Hay un cobro pendiente. La agenda sigue disponible durante la gracia. Si el débito falló, elegí otra forma de pagar."
        : ctx.tenant.access === "today"
          ? "La suscripción está suspendida. Solo podés trabajar la agenda de hoy hasta que se acredite el pago."
          : null;
  const unpaid =
    ctx.tenant.subscriptionStatus === "PAST_DUE" || ctx.tenant.subscriptionStatus === "SUSPENDED";
  const showPayment =
    hasPermission(ctx.membership.role, "billing.manage") &&
    (unpaid || !ctx.tenant.hasPaymentMethod);

  if (ctx.tenant.access === "blocked") {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-semibold">{ctx.tenant.name}</h1>
        <p className="text-muted-foreground text-sm">{notice}</p>
      </main>
    );
  }

  return (
    <div data-tenant={ctx.tenant.slug}>
      {notice ? (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">{notice}</p>
      ) : null}
      {usage.sent >= usage.cap ? (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
          Este mes se llegó al tope de {usage.cap} mensajes. No salen más hasta el mes que viene.
        </p>
      ) : null}
      {showPayment ? (
        <PaymentOptionsForm slug={ctx.tenant.slug} offerDebit={!ctx.tenant.hasPaymentMethod} />
      ) : null}
      <header className="border-border bg-background sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b px-4 py-2 md:px-6">
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-lg font-semibold">{ctx.tenant.name}</span>
          <a
            href={`/${ctx.tenant.slug}/reservar`}
            className="text-muted-foreground shrink-0 text-sm underline"
          >
            Reserva online
          </a>
          <a
            href={`${panelPath(ctx.tenant.slug, "primeros-pasos")}`}
            className="text-muted-foreground shrink-0 text-sm underline"
          >
            Primeros pasos
          </a>
        </span>
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
      <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
        {hasPermission(ctx.membership.role, "billing.manage") ? (
          <CancelSubscriptionForm slug={ctx.tenant.slug} />
        ) : null}
      </div>
      <PanelBottomNav slug={ctx.tenant.slug} showMembers={showMembers} showSite={showSite} />
    </div>
  );
}
