import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { blockedToastMessage } from "@/modules/booking/components/agenda-feedback-toast";

describe("blockedToastMessage", () => {
  it("arma fecha, agenda y día completo", () => {
    assert.equal(
      blockedToastMessage({
        who: "Pedro",
        from: "2026-09-10",
        to: null,
        startTime: null,
        endTime: null,
      }),
      "Horario bloqueado · Pedro · 10/09 · Día completo",
    );
  });

  it("incluye el rango y la franja", () => {
    assert.equal(
      blockedToastMessage({
        who: "Ana",
        from: "2026-09-10",
        to: "2026-09-11",
        startTime: "18:20",
        endTime: "20:20",
      }),
      "Horario bloqueado · Ana · 10/09 – 11/09 · 18:20–20:20",
    );
  });

  it("sin detalle queda en el texto corto", () => {
    assert.equal(
      blockedToastMessage({
        who: null,
        from: null,
        to: null,
        startTime: null,
        endTime: null,
      }),
      "Horario bloqueado",
    );
  });
});
