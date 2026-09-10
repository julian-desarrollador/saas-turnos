"use client";

import { CalendarDays, Ellipsis, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import {
  isPanelLinkActive,
  membersLink,
  mobileMoreLinks,
  mobilePrimaryLinks,
  type PanelLink,
} from "./panel-links";

const primaryIcons = {
  agenda: CalendarDays,
  clients: Users,
} as const;

export function PanelBottomNav({
  slug,
  showMembers = false,
}: {
  slug: string;
  showMembers?: boolean;
}) {
  const pathname = usePathname();
  return <BottomNavBar key={pathname} pathname={pathname} slug={slug} showMembers={showMembers} />;
}

function BottomNavBar({
  pathname,
  slug,
  showMembers,
}: {
  pathname: string;
  slug: string;
  showMembers: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  const moreLinks: PanelLink[] = showMembers
    ? [...mobileMoreLinks, membersLink]
    : [...mobileMoreLinks];
  const moreActive = moreLinks.some((link) => isPanelLinkActive(pathname, slug, link.path));

  return (
    <div>
      {moreOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40"
          aria-label="Cerrar menú"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}
      {moreOpen ? (
        <div
          id={moreId}
          className="border-border bg-background fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t px-4 py-3"
        >
          <nav className="grid gap-1">
            {moreLinks.map((link) => {
              const href = `/${slug}/${link.path}` as Route;
              const active = isPanelLinkActive(pathname, slug, link.path);
              return (
                <Link
                  key={link.path}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm",
                    active ? "bg-muted font-medium" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
      <nav className="border-border bg-background fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t pb-[env(safe-area-inset-bottom)]">
        {mobilePrimaryLinks.map((link) => {
          const Icon = primaryIcons[link.path as keyof typeof primaryIcons];
          const href = `/${slug}/${link.path}` as Route;
          const active = isPanelLinkActive(pathname, slug, link.path);
          return (
            <Link
              key={link.path}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
                active ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
            moreOpen || moreActive ? "text-foreground font-medium" : "text-muted-foreground",
          )}
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? moreId : undefined}
          aria-haspopup="true"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Ellipsis className="size-5" aria-hidden />
          Más
        </button>
      </nav>
    </div>
  );
}
