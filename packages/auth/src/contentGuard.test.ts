import { describe, expect, it } from "vitest";
import {
  clientIp,
  contentLimitsFromEnv,
  dayKey,
  DEFAULT_CONTENT_LIMITS,
  figureExpiry,
  ipBucket,
  planBudget,
  signExamTicket,
  signFigure,
  verifyExamTicket,
  verifyFigure,
} from "./contentGuard";

const headers = (h: Record<string, string>) => (name: string) => h[name] ?? null;
const NOW = 1_800_000_000_000;

describe("clientIp", () => {
  it("takes the entry our proxy appended, never the client-supplied leftmost one", () => {
    expect(clientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.2" }), { hops: 2 })).toBe("203.0.113.7");
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.7" }), { hops: 3 })).toBe("203.0.113.7");
  });

  it("prefers CF-Connecting-IP, honours a pinned header and rejects garbage", () => {
    expect(clientIp(headers({ "cf-connecting-ip": "198.51.100.1", "x-forwarded-for": "172.67.0.1" }))).toBe("198.51.100.1");
    expect(clientIp(headers({ "x-real-ip": "198.51.100.2", "cf-connecting-ip": "1.1.1.1" }), { header: "X-Real-IP" })).toBe("198.51.100.2");
    expect(clientIp(headers({ "x-forwarded-for": "not-an-ip" }))).toBeNull();
    expect(clientIp(headers({}))).toBeNull();
    expect(clientIp(headers({ "x-real-ip": "::ffff:192.0.2.5" }))).toBe("192.0.2.5");
    expect(clientIp(headers({ "x-real-ip": "192.0.2.5:4431" }))).toBe("192.0.2.5");
  });
});

describe("ipBucket", () => {
  it("groups IPv6 by /64 and leaves IPv4 alone", () => {
    expect(ipBucket("192.0.2.5")).toBe("192.0.2.5");
    expect(ipBucket("2001:db8:1:2:aaaa::1")).toBe("2001:0db8:0001:0002::/64");
    expect(ipBucket("2001:db8:1:2::ffff")).toBe(ipBucket("2001:0db8:0001:0002:1:2:3:4"));
    expect(ipBucket("::1")).toBe("0000:0000:0000:0000::/64");
  });
});

describe("daily budget", () => {
  it("counts only questions not seen today", () => {
    expect(planBudget(new Set([1, 2]), 2, [1, 2, 3, 3], 3)).toEqual({ ok: true, fresh: [3] });
    expect(planBudget(new Set([1, 2]), 2, [3, 4], 3)).toEqual({ ok: false, fresh: [3, 4] });
    expect(planBudget(new Set(), 400, [], 400).ok).toBe(true);
  });

  it("rolls over at midnight in Israel", () => {
    expect(dayKey(new Date("2026-03-01T21:59:00Z"))).toBe("2026-03-01");
    expect(dayKey(new Date("2026-03-01T22:01:00Z"))).toBe("2026-03-02");
  });

  it("reads overrides from the environment", () => {
    expect(contentLimitsFromEnv({})).toEqual(DEFAULT_CONTENT_LIMITS);
    const l = contentLimitsFromEnv({ CONTENT_LIMIT_USER_VIEWS_PER_DAY: "900", CONTENT_LIMIT_IP_PER_MINUTE: "-1" });
    expect(l.userViewsPerDay).toBe(900);
    expect(l.ipPerMinute).toBe(DEFAULT_CONTENT_LIMITS.ipPerMinute);
  });
});

describe("signed figure URLs", () => {
  it("verify until expiry, only for the signed file", () => {
    const exp = figureExpiry(NOW);
    expect(exp * 1000 - NOW).toBeGreaterThan(86_400_000);
    expect(figureExpiry(NOW + 1000)).toBe(exp); // stable within the day
    const sig = signFigure("q0009-s1.webp", exp, "s3cret");
    expect(verifyFigure("q0009-s1.webp", exp, sig, "s3cret", NOW)).toBe(true);
    expect(verifyFigure("q0010-s1.webp", exp, sig, "s3cret", NOW)).toBe(false);
    expect(verifyFigure("q0009-s1.webp", exp + 86_400, sig, "s3cret", NOW)).toBe(false);
    expect(verifyFigure("q0009-s1.webp", exp, sig, "other", NOW)).toBe(false);
    expect(verifyFigure("q0009-s1.webp", exp, sig, "s3cret", exp * 1000 + 1)).toBe(false);
    expect(verifyFigure("../bank.json", exp, sig, "s3cret", NOW)).toBe(false);
    const sub = signFigure("q0124-o1-1.webp", exp, "s3cret");
    expect(verifyFigure("q0124-o1-1.webp", exp, sub, "s3cret", NOW)).toBe(true);
  });
});

describe("exam tickets", () => {
  it("bind the drawn numbers to the user and expire", () => {
    const t = signExamTicket({ sub: "u1", level: "technician", ns: [5, 9] }, "s3cret", NOW);
    expect(verifyExamTicket(t, "s3cret", "u1", NOW + 1000)).toMatchObject({ ns: [5, 9], level: "technician" });
    expect(verifyExamTicket(t, "s3cret", "u2", NOW)).toBeNull();
    expect(verifyExamTicket(t, "other", "u1", NOW)).toBeNull();
    expect(verifyExamTicket(t, "s3cret", "u1", NOW + 40 * 3600 * 1000)).toBeNull();
    const [, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u1", level: "technician", ns: [1, 2, 3], iat: NOW / 1000 })).toString("base64url");
    expect(verifyExamTicket(`${forged}.${sig}`, "s3cret", "u1", NOW)).toBeNull();
    expect(verifyExamTicket(42, "s3cret", "u1", NOW)).toBeNull();
  });
});
