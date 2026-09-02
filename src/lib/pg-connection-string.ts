const SSLMODES_ALIASED_TO_VERIFY_FULL = new Set(["prefer", "require", "verify-ca"]);

/**
 * `pg` treats sslmode=require|prefer|verify-ca as verify-full and emits a
 * process warning. Next.js surfaces that warning as a console overlay on
 * every request that opens a connection. Making the mode explicit keeps the
 * current (stricter) behavior without the noise.
 */
export function withExplicitPgSsl(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }

  const sslmode = parsed.searchParams.get("sslmode");
  if (sslmode && SSLMODES_ALIASED_TO_VERIFY_FULL.has(sslmode)) {
    parsed.searchParams.set("sslmode", "verify-full");
  }

  return parsed.href;
}
