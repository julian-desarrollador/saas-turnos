import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  moreOptionsShouldOpen,
  serviceMetaLabel,
  serviceSummaries,
  serviceToastMessage,
} from "@/modules/tenant-config/components/service-view";

describe("service view", () => {
  it("arma duración y precio para la card", () => {
    assert.equal(serviceMetaLabel(45, 12000), "45 min · $12.000");
  });

  it("ordena activos primero y por nombre", () => {
    const summaries = serviceSummaries(
      [
        { id: "s2", name: "Tintura", isActive: true, durationMinutes: 60, priceAmount: 20000 },
        { id: "s3", name: "Barba", isActive: false, durationMinutes: 20, priceAmount: 5000 },
        { id: "s1", name: "Corte", isActive: true, durationMinutes: 30, priceAmount: 8000 },
      ],
      [{ serviceIds: ["s2"] }],
    );

    assert.deepEqual(
      summaries.map((item) => item.name),
      ["Corte", "Tintura", "Barba"],
    );
    assert.equal(summaries[0]?.offeredByCount, 0);
    assert.equal(summaries[1]?.offeredByCount, 1);
  });

  it("abre Más opciones solo si ya hay prep, limpieza o ventana", () => {
    assert.equal(
      moreOptionsShouldOpen({
        prepMinutes: 0,
        cleanupMinutes: 0,
        earliestStart: null,
        latestStart: null,
      }),
      false,
    );
    assert.equal(
      moreOptionsShouldOpen({
        prepMinutes: 10,
        cleanupMinutes: 0,
        earliestStart: null,
        latestStart: null,
      }),
      true,
    );
    assert.equal(
      moreOptionsShouldOpen({
        prepMinutes: 0,
        cleanupMinutes: 0,
        earliestStart: "09:00",
        latestStart: null,
      }),
      true,
    );
  });

  it("confirma el cambio con el nombre del servicio", () => {
    assert.equal(serviceToastMessage("created", "Corte"), "Servicio agregado · Corte");
    assert.equal(serviceToastMessage("saved", "  "), "Cambios guardados");
    assert.equal(serviceToastMessage(null, "Corte"), null);
  });
});
