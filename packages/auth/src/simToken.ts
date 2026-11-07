import { createHmac, timingSafeEqual } from "node:crypto";
import type { Plan } from "./features";

/**
 * Short-lived token the hub hands to an embedded simulator (see @electricademy/sim-sdk).
 * Format: base64url(JSON claims) + "." + base64url(HMAC-SHA256). Bound to one simulator,
 * so a token issued to one lab cannot be replayed against another.
 */
export interface SimTokenClaims {
  /** User id. */
  sub: string;
  name: string | null;
  plan: Plan;
  /** Simulator slug the token was issued for. */
  sim: string;
  /** Expiry, seconds since epoch. */
  exp: number;
}

export const SIM_TOKEN_TTL_SECONDS = 15 * 60;

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const sign = (data: string, secret: string) => createHmac("sha256", `sim-token:${secret}`).update(data).digest();

export function signSimToken(
  claims: Omit<SimTokenClaims, "exp">,
  secret: string,
  now = Date.now(),
  ttlSeconds = SIM_TOKEN_TTL_SECONDS,
): string {
  if (!secret) throw new Error("A signing secret is required");
  const body = b64(JSON.stringify({ ...claims, exp: Math.floor(now / 1000) + ttlSeconds } satisfies SimTokenClaims));
  return `${body}.${b64(sign(body, secret))}`;
}

/** Returns the claims, or null when the token is malformed, forged, expired or for another simulator. */
export function verifySimToken(token: string, secret: string, simulator: string, now = Date.now()): SimTokenClaims | null {
  if (!secret || typeof token !== "string" || token.length > 2048) return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = sign(body, secret);
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let claims: SimTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SimTokenClaims;
  } catch {
    return null;
  }
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;
  if (claims.sim !== simulator) return null;
  return claims;
}
