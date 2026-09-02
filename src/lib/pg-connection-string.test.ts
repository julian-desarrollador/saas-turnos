import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { withExplicitPgSsl } from "./pg-connection-string";

describe("withExplicitPgSsl", () => {
  it("cambia sslmode=require a verify-full", () => {
    const next = withExplicitPgSsl(
      "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require",
    );
    const parsed = new URL(next);
    assert.equal(parsed.searchParams.get("sslmode"), "verify-full");
    assert.equal(parsed.username, "user");
    assert.equal(parsed.password, "pass");
  });

  it("no toca una URL local sin sslmode", () => {
    const local = "postgresql://postgres:postgres@localhost:5432/saas_turnos?schema=public";
    assert.equal(withExplicitPgSsl(local), local);
  });

  it("deja verify-full como está", () => {
    const url = "postgresql://user:pass@host/db?sslmode=verify-full";
    assert.equal(new URL(withExplicitPgSsl(url)).searchParams.get("sslmode"), "verify-full");
  });
});
