"use client";

import { CalendarDays, Home, Scissors, User } from "lucide-react";
import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { publicTheme as t, type PublicAccent } from "@/components/shared/public-template";
import { cn } from "@/lib/utils";

const links = [
  { path: "", label: "Inicio", icon: Home },
  { path: "/servicios", label: "Servicios", icon: Scissors },
  { path: "/reservar", label: "Reservar", icon: CalendarDays },
  { path: "/perfil", label: "Perfil", icon: User },
] as const;

export function PublicBottomNav({ slug, accent }: { slug: string; accent: PublicAccent }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md grid-cols-4 border-t bg-[#f7f4ef]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        t.line,
      )}
    >
      {links.map((link) => {
        const href = `/${slug}${link.path}` as Route;
        const active =
          link.path === ""
            ? pathname === `/${slug}`
            : pathname === `/${slug}${link.path}` || pathname.startsWith(`/${slug}${link.path}/`);
        return (
          <Link
            key={link.label}
            href={href}
            className="block"
            aria-current={active ? "page" : undefined}
          >
            <NavLabel active={active} label={link.label} icon={link.icon} accent={accent} />
          </Link>
        );
      })}
    </nav>
  );
}

function NavLabel({
  active,
  label,
  icon: Icon,
  accent,
}: {
  active: boolean;
  label: string;
  icon: typeof Home;
  accent: PublicAccent;
}) {
  const { pending } = useLinkStatus();
  const highlighted = active || pending;
  return (
    <span
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.16em] uppercase",
        highlighted ? accent.text : t.muted,
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
      {label}
    </span>
  );
}
