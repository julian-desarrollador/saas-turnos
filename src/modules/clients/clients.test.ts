import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryClientRepository } from "@/modules/clients/adapters/outbound/memory-client-repository";
import { ClientsError } from "@/modules/clients/application/errors";
import type { ClientFicha } from "@/modules/clients/application/ports/client-repository";
import { CLIENT_QUERY_MAX, parseClientSearch } from "@/modules/clients/application/search";
import { createFindOrCreateClient } from "@/modules/clients/application/use-cases/find-or-create-client";
import { createGetClientFicha } from "@/modules/clients/application/use-cases/get-client-ficha";
import { createListClients } from "@/modules/clients/application/use-cases/list-clients";
import { normalizePhone, whatsAppChatUrl } from "@/modules/clients/domain/phone";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ownerA = { tenantId: tenantA, role: "OWNER" as const };
const receptionA = { tenantId: tenantA, role: "RECEPTION" as const };
const luciaId = "11111111-1111-1111-1111-111111111111";
const marcoId = "22222222-2222-2222-2222-222222222222";
const otherId = "33333333-3333-3333-3333-333333333333";

function ficha(
  overrides: Pick<ClientFicha, "id" | "tenantId" | "phone"> & Partial<ClientFicha>,
): ClientFicha {
  return {
    firstName: null,
    lastName: null,
    email: null,
    notes: null,
    ...overrides,
  };
}

const lucia = ficha({
  id: luciaId,
  tenantId: tenantA,
  phone: "+5491112345678",
  firstName: "Lucía",
  lastName: "Pérez",
  notes: "Prefiere la mañana",
});

const marco = ficha({
  id: marcoId,
  tenantId: tenantA,
  phone: "+5491188888888",
  firstName: "Marco",
});

const otherTenant = ficha({
  id: otherId,
  tenantId: tenantB,
  phone: "+5491112345678",
  firstName: "Lucía",
  lastName: "De otro negocio",
});

describe("normalizePhone", () => {
  it("acepta E.164 y compacta espacios y guiones", () => {
    assert.equal(normalizePhone("+54 9 11 1234-5678"), "+5491112345678");
  });

  it("antepone +549 a un celular argentino de 10 dígitos", () => {
    assert.equal(normalizePhone("11 1234 5678"), "+5491112345678");
  });

  it("antepone + a un número que ya trae 54", () => {
    assert.equal(normalizePhone("5491112345678"), "+5491112345678");
  });

  it("rechaza un valor que no llega a E.164", () => {
    assert.equal(normalizePhone("123"), null);
    assert.equal(normalizePhone(""), null);
  });
});

describe("whatsAppChatUrl", () => {
  it("arma wa.me con dígitos internacionales sin +", () => {
    assert.equal(whatsAppChatUrl("+54 9 11 1234-5678"), "https://wa.me/5491112345678");
  });

  it("devuelve null si el teléfono no es válido", () => {
    assert.equal(whatsAppChatUrl("123"), null);
  });
});

describe("parseClientSearch", () => {
  it("separa nombre y teléfono en tokens", () => {
    assert.deepEqual(parseClientSearch("Lucía 1112345678"), [
      { name: "Lucía", phoneExact: null, phoneContains: null },
      { name: null, phoneExact: "+5491112345678", phoneContains: null },
    ]);
  });

  it("trata un teléfono escrito con espacios como un solo término", () => {
    assert.deepEqual(parseClientSearch("11 1234 5678"), [
      { name: null, phoneExact: "+5491112345678", phoneContains: null },
    ]);
  });

  it("trata un tramo de dígitos corto como teléfono parcial", () => {
    assert.deepEqual(parseClientSearch("5678"), [
      { name: null, phoneExact: null, phoneContains: "5678" },
    ]);
  });
});

describe("findOrCreateClient", () => {
  it("crea la ficha la primera vez", async () => {
    const findOrCreateClient = createFindOrCreateClient(createMemoryClientRepository());
    const created = await findOrCreateClient({
      actor: ownerA,
      phone: "1112345678",
      firstName: "Lucía",
    });
    assert.equal(created.phone, "+5491112345678");
    assert.equal(created.firstName, "Lucía");
    assert.equal(created.email, null);
  });

  it("devuelve la ficha existente y no pisa el nombre", async () => {
    const repo = createMemoryClientRepository([lucia]);
    const findOrCreateClient = createFindOrCreateClient(repo);
    const found = await findOrCreateClient({
      actor: ownerA,
      phone: "+54 9 11 1234-5678",
      firstName: "Otro",
    });
    assert.equal(found.id, luciaId);
    assert.equal(found.firstName, "Lucía");
  });

  it("completa el nombre si la ficha no tenía", async () => {
    const repo = createMemoryClientRepository([
      ficha({
        id: luciaId,
        tenantId: tenantA,
        phone: "+5491112345678",
      }),
    ]);
    const findOrCreateClient = createFindOrCreateClient(repo);
    const found = await findOrCreateClient({
      actor: ownerA,
      phone: "1112345678",
      firstName: "Lucía",
    });
    assert.equal(found.firstName, "Lucía");
  });

  it("rechaza un teléfono inválido", async () => {
    const findOrCreateClient = createFindOrCreateClient(createMemoryClientRepository());
    await assert.rejects(
      () => findOrCreateClient({ actor: ownerA, phone: "12", firstName: null }),
      (error: unknown) => error instanceof ClientsError && error.reason === "PHONE_INVALID",
    );
  });
});

describe("listClients", () => {
  it("lista solo el tenant del actor y ordena por apellido", async () => {
    const listClients = createListClients(
      createMemoryClientRepository([marco, lucia, otherTenant]),
    );
    const { clients, hasMore } = await listClients({ actor: receptionA, query: "" });
    assert.equal(hasMore, false);
    assert.deepEqual(
      clients.map((row) => row.id),
      [luciaId, marcoId],
    );
  });

  it("busca por nombre sin distinguir mayúsculas", async () => {
    const listClients = createListClients(createMemoryClientRepository([lucia, marco]));
    const { clients } = await listClients({ actor: ownerA, query: "lucía" });
    assert.equal(clients.length, 1);
    assert.equal(clients[0]?.id, luciaId);
  });

  it("busca por teléfono local argentino", async () => {
    const listClients = createListClients(createMemoryClientRepository([lucia, marco]));
    const { clients } = await listClients({ actor: ownerA, query: "11 1234 5678" });
    assert.equal(clients.length, 1);
    assert.equal(clients[0]?.id, luciaId);
  });

  it("no devuelve la homónima de otro negocio", async () => {
    const listClients = createListClients(createMemoryClientRepository([lucia, otherTenant]));
    const { clients } = await listClients({ actor: ownerA, query: "Lucía" });
    assert.equal(clients.length, 1);
    assert.equal(clients[0]?.id, luciaId);
  });

  it("rechaza una búsqueda demasiado larga", async () => {
    const listClients = createListClients(createMemoryClientRepository());
    await assert.rejects(
      () => listClients({ actor: ownerA, query: "x".repeat(CLIENT_QUERY_MAX + 1) }),
      (error: unknown) => error instanceof ClientsError && error.reason === "QUERY_TOO_LONG",
    );
  });

  it("enriquece cada fila con cantidad de visitas y última fecha", async () => {
    const listClients = createListClients(
      createMemoryClientRepository(
        [lucia, marco],
        [
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
            tenantId: tenantA,
            clientId: luciaId,
            professionalId: "44444444-4444-4444-4444-444444444444",
            professionalName: "Ana",
            localDate: "2026-08-20",
            localTime: "10:00",
            durationMinutes: 50,
            status: "CANCELLED",
            serviceName: "Corte",
          },
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
            tenantId: tenantA,
            clientId: luciaId,
            professionalId: "44444444-4444-4444-4444-444444444444",
            professionalName: "Ana",
            localDate: "2026-08-25",
            localTime: "15:00",
            durationMinutes: 50,
            status: "CONFIRMED",
            serviceName: "Color",
          },
        ],
      ),
    );
    const { clients } = await listClients({ actor: ownerA, query: "" });
    const luciaRow = clients.find((row) => row.id === luciaId);
    const marcoRow = clients.find((row) => row.id === marcoId);
    assert.equal(luciaRow?.visitCount, 2);
    assert.equal(luciaRow?.lastVisitLocalDate, "2026-08-25");
    assert.equal(marcoRow?.visitCount, 0);
    assert.equal(marcoRow?.lastVisitLocalDate, null);
  });
});

describe("getClientFicha", () => {
  it("devuelve datos y turnos del más reciente al más viejo, incluidos cancelados", async () => {
    const getClientFicha = createGetClientFicha(
      createMemoryClientRepository(
        [lucia],
        [
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
            tenantId: tenantA,
            clientId: luciaId,
            professionalId: "44444444-4444-4444-4444-444444444444",
            professionalName: "Ana",
            localDate: "2026-08-20",
            localTime: "10:00",
            durationMinutes: 50,
            status: "CANCELLED",
            serviceName: "Corte de dama",
          },
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
            tenantId: tenantA,
            clientId: luciaId,
            professionalId: "44444444-4444-4444-4444-444444444444",
            professionalName: "Ana",
            localDate: "2026-08-25",
            localTime: "15:00",
            durationMinutes: 50,
            status: "CONFIRMED",
            serviceName: "Coloración",
          },
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
            tenantId: tenantA,
            clientId: marcoId,
            professionalId: "44444444-4444-4444-4444-444444444444",
            professionalName: "Ana",
            localDate: "2026-08-25",
            localTime: "11:00",
            durationMinutes: 50,
            status: "CONFIRMED",
            serviceName: "Corte de dama",
          },
        ],
      ),
    );
    const fichaResult = await getClientFicha({ actor: receptionA, clientId: luciaId });
    assert.equal(fichaResult.client.notes, "Prefiere la mañana");
    assert.deepEqual(
      fichaResult.appointments.map((row) => row.id),
      ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"],
    );
    assert.equal(fichaResult.appointments[1]?.status, "CANCELLED");
  });

  it("no revela una ficha de otro tenant", async () => {
    const getClientFicha = createGetClientFicha(createMemoryClientRepository([otherTenant]));
    await assert.rejects(
      () => getClientFicha({ actor: ownerA, clientId: otherId }),
      (error: unknown) => error instanceof ClientsError && error.code === "NOT_FOUND",
    );
  });

  it("trata un id inválido como inexistente", async () => {
    const getClientFicha = createGetClientFicha(createMemoryClientRepository([lucia]));
    await assert.rejects(
      () => getClientFicha({ actor: ownerA, clientId: "no-es-uuid" }),
      (error: unknown) => error instanceof ClientsError && error.code === "NOT_FOUND",
    );
  });
});
