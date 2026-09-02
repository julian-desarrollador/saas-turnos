import { User } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { clientDisplayName } from "@/modules/clients/adapters/inbound/messages";
import type { ClientListItem } from "@/modules/clients/application/use-cases/list-clients";

function formatVisitDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) {
    return localDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function visitMeta(client: ClientListItem): string {
  if (client.visitCount === 0) {
    return "Sin visitas";
  }
  const visitsLabel = client.visitCount === 1 ? "1 visita" : `${client.visitCount} visitas`;
  if (!client.lastVisitLocalDate) {
    return visitsLabel;
  }
  return `${visitsLabel} · última ${formatVisitDate(client.lastVisitLocalDate)}`;
}

export function ClientList({ slug, clients }: { slug: string; clients: ClientListItem[] }) {
  return (
    <ul className="grid gap-3">
      {clients.map((client) => {
        const name = clientDisplayName(client);
        return (
          <li key={client.id}>
            <Link
              href={`/${slug}/clients/${client.id}` as Route}
              className="border-border bg-card hover:border-primary/25 flex items-center gap-4 rounded-[24px] border px-4 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition active:scale-[0.99]"
            >
              <span className="bg-muted text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <User className="size-5" strokeWidth={1.85} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold">{name}</span>
                <span className="text-muted-foreground mt-0.5 block text-sm">{client.phone}</span>
                <span className="text-muted-foreground/80 mt-1 block text-[13px]">
                  {visitMeta(client)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
