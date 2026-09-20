import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTenantSlug } from "@/core/tenant-slug";

describe("isTenantSlug", () => {
  it("acepta slugs en minúsculas con guiones internos", () => {
    assert.equal(isTenantSlug("demo"), true);
    assert.equal(isTenantSlug("peluqueria-norte"), true);
    assert.equal(isTenantSlug("a1"), true);
  });

  it("rechaza estáticos y segmentos que no pueden ser un negocio", () => {
    assert.equal(isTenantSlug("favicon.ico"), false);
    assert.equal(isTenantSlug("icon.png"), false);
    assert.equal(isTenantSlug(""), false);
    assert.equal(isTenantSlug("Demo"), false);
    assert.equal(isTenantSlug("-demo"), false);
    assert.equal(isTenantSlug("demo-"), false);
    assert.equal(isTenantSlug("foo--bar"), false);
  });
});
