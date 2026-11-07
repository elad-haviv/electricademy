import { describe, expect, it } from "vitest";
import { signSimToken, verifySimToken } from "./simToken";

const claims = { sub: "u1", name: "Dana", plan: "pro" as const, sim: "agl-edu" };
const NOW = 1_800_000_000_000;

describe("sim tokens", () => {
  it("round-trips for the simulator it was issued to", () => {
    const token = signSimToken(claims, "s3cret", NOW);
    expect(verifySimToken(token, "s3cret", "agl-edu", NOW + 1000)).toMatchObject(claims);
  });

  it("rejects another simulator, a wrong secret, tampering and expiry", () => {
    const token = signSimToken(claims, "s3cret", NOW, 60);
    expect(verifySimToken(token, "s3cret", "hv-edu", NOW)).toBeNull();
    expect(verifySimToken(token, "other", "agl-edu", NOW)).toBeNull();
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...claims, plan: "pro", sub: "admin", exp: 9e9 })).toString("base64url");
    expect(verifySimToken(`${forged}.${mac}`, "s3cret", "agl-edu", NOW)).toBeNull();
    expect(verifySimToken(`${body}.${mac}x`, "s3cret", "agl-edu", NOW)).toBeNull();
    expect(verifySimToken(token, "s3cret", "agl-edu", NOW + 61_000)).toBeNull();
    expect(verifySimToken("garbage", "s3cret", "agl-edu", NOW)).toBeNull();
  });

  it("refuses to sign without a secret", () => {
    expect(() => signSimToken(claims, "", NOW)).toThrow();
  });
});
