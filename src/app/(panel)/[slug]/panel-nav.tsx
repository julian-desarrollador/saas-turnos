"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { desktopLinks, isPanelLinkActive, membersLink, type PanelLink } from "./panel-links";

function NavLink({ slug, link }: { slug: string; link: PanelLink }) {
  const pathname = usePathname();
  const href = `/${slug}/${link.path}` as Route;
  const active = isPanelLinkActive(pathname, slug, link.path);

  return (
    <Link
      href={href}
      className={cn(
        "hover:text-foreground text-sm",
        active ? "text-foreground font-medium" : "text-muted-foreground",
      )}
    >
      {link.label}
    </Link>
  );
}

export function PanelNav({ slug, showMembers = false }: { slug: string; showMembers?: boolean }) {
  return (
    <nav className="hidden items-center gap-4 md:flex">
      {desktopLinks.map((link) => (
        <NavLink key={link.path} slug={slug} link={link} />
      ))}
      {showMembers ? <NavLink slug={slug} link={membersLink} /> : null}
    </nav>
  );
}
