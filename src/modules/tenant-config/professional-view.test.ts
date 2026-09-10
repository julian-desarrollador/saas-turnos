import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  professionalSummaries,
  scheduledProfessionalIds,
  serviceCountLabel,
  teamToastMessage,
} from "@/modules/tenant-config/components/professional-view";

const professionals = [
  { id: "p2", displayName: "Zoe", isActive: true, serviceIds: ["s1", "s2"] },
  { id: "p3", displayName: "Bruno", isActive: false, serviceIds: ["s1"] },
  { id: "p1", displayName: "Ana", isActive: true, serviceIds: [] },
];

describe("professional view", () => {
  it("ordena activos primero y por nombre", () => {
    const summaries = professionalSummaries(professionals, new Set<string>());

    assert.deepEqual(
      summaries.map((item) => item.displayName),
      ["Ana", "Zoe", "Bruno"],
    );
  });

  it("cuenta servicios y marca quién tiene horario propio", () => {
    const withSchedule = scheduledProfessionalIds([
      { professionalId: "p2" },
      { professionalId: null },
      { professionalId: "p2" },
    ]);
    const summaries = professionalSummaries(professionals, withSchedule);
    const ana = summaries.find((item) => item.id === "p1");
    const zoe = summaries.find((item) => item.id === "p2");

    assert.equal(ana?.serviceCount, 0);
    assert.equal(ana?.hasSchedule, false);
    assert.equal(zoe?.serviceCount, 2);
    assert.equal(zoe?.hasSchedule, true);
  });

  it("avisa en palabras cuántos servicios presta", () => {
    assert.equal(serviceCountLabel(0), "Sin servicios asignados");
    assert.equal(serviceCountLabel(1), "1 servicio");
    assert.equal(serviceCountLabel(3), "3 servicios");
  });

  it("confirma el cambio con el nombre de la persona", () => {
    assert.equal(teamToastMessage("created", "Ana"), "Profesional agregado · Ana");
    assert.equal(teamToastMessage("saved", "  "), "Cambios guardados");
    assert.equal(teamToastMessage(null, "Ana"), null);
  });
});
