import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatRescheduleDate,
  formatRescheduleTimeRange,
  rescheduleClientName,
} from "@/modules/booking/components/reschedule-view";

describe("reschedule view", () => {
  it("muestra la fecha y el horario en lenguaje humano", () => {
    assert.equal(formatRescheduleDate("2026-10-30"), "viernes, 30 de octubre de 2026");
    assert.equal(formatRescheduleTimeRange("13:30", "15:20"), "13:30 a 15:20");
  });

  it("muestra el nombre completo sin mezclarlo con el teléfono", () => {
    assert.equal(
      rescheduleClientName({ clientFirstName: "Mauro", clientLastName: "Pérez" }),
      "Mauro Pérez",
    );
    assert.equal(rescheduleClientName({ clientFirstName: null, clientLastName: null }), "Cliente");
  });
});
