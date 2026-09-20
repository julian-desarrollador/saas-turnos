import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countTimePickerTap } from "@/components/shared/close-time-picker";

describe("countTimePickerTap", () => {
  it("no cuenta un valor incompleto", () => {
    assert.deepEqual(countTimePickerTap(0, ""), { taps: 0, shouldBlur: false });
    assert.deepEqual(countTimePickerTap(0, "09"), { taps: 0, shouldBlur: false });
  });

  it("cierra al completar hora y minuto", () => {
    const afterHour = countTimePickerTap(0, "09:00");
    assert.deepEqual(afterHour, { taps: 1, shouldBlur: false });
    assert.deepEqual(countTimePickerTap(afterHour.taps, "09:30"), { taps: 2, shouldBlur: true });
  });
});
