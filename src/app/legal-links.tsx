import Link from "next/link";

import { cn } from "@/lib/utils";

export function LegalLinks({ className }: { className?: string }) {
  return (
    <p className={cn("text-center text-xs", className ?? "text-muted-foreground")}>
      <Link href="/terminos" className="underline">
        Términos
      </Link>
      {" · "}
      <Link href="/privacidad" className="underline">
        Privacidad
      </Link>
    </p>
  );
}
