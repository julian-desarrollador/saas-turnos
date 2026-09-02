"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  fetchClientsAction,
  type ClientsListPayload,
} from "@/modules/clients/adapters/inbound/actions";
import type { ClientListItem } from "@/modules/clients/application/use-cases/list-clients";
import { ClientList } from "@/modules/clients/components/client-list";
import { ClientSearchInput } from "@/modules/clients/components/client-search-input";

const SEARCH_DEBOUNCE_MS = 280;

export function ClientsHomeClient({
  slug,
  tenantName,
  initialQuery,
  initialClients,
  initialHasMore,
  initialListLimit,
  initialError,
}: {
  slug: string;
  tenantName: string;
  initialQuery: string;
  initialClients: ClientListItem[];
  initialHasMore: boolean;
  initialListLimit: number;
  initialError?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [clients, setClients] = useState(initialClients);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [listLimit, setListLimit] = useState(initialListLimit);
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();
  const skipFirstFetch = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    startTransition(async () => {
      const payload: ClientsListPayload = await fetchClientsAction(slug, debouncedQuery);
      setClients(payload.clients);
      setHasMore(payload.hasMore);
      setListLimit(payload.listLimit);
      setError(payload.error);
    });
  }, [debouncedQuery, slug]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="grid gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Panel
        </p>
        <h1 className="text-[22px] leading-tight font-bold">Clientes</h1>
        <p className="text-muted-foreground text-sm">
          Historial de {tenantName}. Se crean al cargar un turno.
        </p>
      </header>

      <ClientSearchInput value={query} onChange={setQuery} />

      <section className="space-y-3 pb-4">
        {pending ? (
          <p className="text-muted-foreground py-8 text-center text-[15px]">Cargando clientes…</p>
        ) : error ? (
          <p
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-[15px]"
          >
            {error}
          </p>
        ) : clients.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-[15px]">
            {debouncedQuery
              ? "No hay resultados para esa búsqueda."
              : "Todavía no hay clientes con turnos registrados."}
          </p>
        ) : (
          <ClientList slug={slug} clients={clients} />
        )}

        {hasMore && !pending && !error ? (
          <p className="text-muted-foreground text-center text-sm">
            Mostramos los primeros {listLimit}. Acotá la búsqueda por nombre o teléfono.
          </p>
        ) : null}
      </section>
    </main>
  );
}
