import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clientFichaBackAriaLabel,
  clientFichaBackHref,
  clientFichaFromAgendaHref,
  clientFichaHref,
  clientFichaToastMessage,
} from "@/modules/clients/components/client-ficha-view";

describe("client ficha back", () => {
  it("vuelve a la agenda del día cuando se abrió desde ahí", () => {
    assert.equal(
      clientFichaBackHref("demo", "agenda", "2026-09-11"),
      "/demo/agenda?date=2026-09-11",
    );
    assert.equal(clientFichaBackAriaLabel("agenda", "2026-09-11"), "Volver a la agenda");
  });

  it("vuelve a la lista si no hay origen de agenda o la fecha no sirve", () => {
    assert.equal(clientFichaBackHref("demo"), "/demo/clients");
    assert.equal(clientFichaBackHref("demo", "agenda", "no-es-fecha"), "/demo/clients");
    assert.equal(clientFichaBackHref("demo", "agenda", "2026-13-40"), "/demo/clients");
    assert.equal(clientFichaBackHref("demo", "clients", "2026-09-11"), "/demo/clients");
    assert.equal(clientFichaBackAriaLabel(), "Volver a clientes");
  });

  it("arma el enlace de Ver ficha con origen y día", () => {
    assert.equal(
      clientFichaFromAgendaHref("demo", "client-1", "2026-09-11"),
      "/demo/clients/client-1?from=agenda&date=2026-09-11",
    );
  });

  it("conserva el origen de agenda al marcar guardado", () => {
    assert.equal(
      clientFichaHref("demo", "client-1", {
        from: "agenda",
        date: "2026-09-11",
        saved: true,
      }),
      "/demo/clients/client-1?from=agenda&date=2026-09-11&saved=1",
    );
    assert.equal(
      clientFichaHref("demo", "client-1", { saved: true }),
      "/demo/clients/client-1?saved=1",
    );
  });
});

describe("client ficha toast", () => {
  it("dice Cambios guardados cuando saved=1", () => {
    assert.equal(clientFichaToastMessage("1"), "Cambios guardados");
    assert.equal(clientFichaToastMessage("  "), null);
    assert.equal(clientFichaToastMessage(), null);
  });
});
