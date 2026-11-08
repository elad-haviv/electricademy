import { describe, expect, it } from "vitest";
import { FIRST_PARTY_ITEMS, OPTIONAL_CATEGORIES, SIMULATOR_EMBEDS } from "./registry";
import {
  CONSENT_MAX_AGE_DAYS,
  NO_CONSENT,
  POLICY_VERSION,
  allChoices,
  allows,
  allowsAll,
  createRecord,
  effectiveChoices,
  grant,
  isCurrent,
  needsDecision,
  parseRecord,
  withdrawn,
  type ConsentRecord,
} from "./state";

const NOW = new Date("2026-11-08T10:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

describe("defaults", () => {
  it("asks when nothing is stored and allows only necessary storage", () => {
    expect(needsDecision(null, NOW)).toBe(true);
    expect(effectiveChoices(null, NOW)).toEqual(NO_CONSENT);
    expect(allows(null, "necessary", NOW)).toBe(true);
    for (const c of OPTIONAL_CATEGORIES) expect(allows(null, c, NOW)).toBe(false);
  });

  it("nothing optional is pre-ticked", () => {
    expect(Object.values(NO_CONSENT).every((v) => v === false)).toBe(true);
  });
});

describe("createRecord", () => {
  it("stamps time, policy version and expiry", () => {
    const r = createRecord(allChoices(true), "accept-all", NOW);
    expect(r.policyVersion).toBe(POLICY_VERSION);
    expect(r.decidedAt).toBe(NOW.toISOString());
    expect(Date.parse(r.expiresAt) - NOW.getTime()).toBe(CONSENT_MAX_AGE_DAYS * 86_400_000);
    expect(r.method).toBe("accept-all");
  });

  it("keeps only known categories", () => {
    const r = createRecord({ functional: true, analytics: false, marketing: true } as never, "custom", NOW);
    expect(r.choices).toEqual({ functional: true, analytics: false });
  });

  it("accept all / reject all", () => {
    expect(createRecord(allChoices(true), "accept-all", NOW).choices).toEqual({ functional: true, analytics: true });
    expect(createRecord(allChoices(false), "reject-all", NOW).choices).toEqual({ functional: false, analytics: false });
  });
});

describe("validity", () => {
  const accepted = createRecord(allChoices(true), "accept-all", NOW);

  it("is current right after the decision and until it expires", () => {
    expect(isCurrent(accepted, NOW)).toBe(true);
    expect(isCurrent(accepted, days(CONSENT_MAX_AGE_DAYS - 1))).toBe(true);
    expect(allows(accepted, "analytics", days(30))).toBe(true);
  });

  it("expires after the max age and asks again", () => {
    const later = days(CONSENT_MAX_AGE_DAYS + 1);
    expect(isCurrent(accepted, later)).toBe(false);
    expect(needsDecision(accepted, later)).toBe(true);
    expect(allows(accepted, "functional", later)).toBe(false);
  });

  it("max age is between 6 and 12 months", () => {
    expect(CONSENT_MAX_AGE_DAYS).toBeGreaterThanOrEqual(180);
    expect(CONSENT_MAX_AGE_DAYS).toBeLessThanOrEqual(366);
  });

  it("a different policy version asks again", () => {
    const old: ConsentRecord = { ...accepted, policyVersion: "2020-01-01" };
    expect(needsDecision(old, NOW)).toBe(true);
    expect(allows(old, "analytics", NOW)).toBe(false);
  });

  it("does not trust a record stretched past the max age or dated in the future", () => {
    const stretched: ConsentRecord = { ...accepted, expiresAt: days(CONSENT_MAX_AGE_DAYS * 3).toISOString() };
    expect(isCurrent(stretched, NOW)).toBe(false);
    const future = createRecord(allChoices(true), "accept-all", days(10));
    expect(isCurrent(future, NOW)).toBe(false);
  });

  it("a rejection is also remembered (no re-asking on every page)", () => {
    const rejected = createRecord(allChoices(false), "reject-all", NOW);
    expect(needsDecision(rejected, days(1))).toBe(false);
    expect(allows(rejected, "functional", days(1))).toBe(false);
  });
});

describe("parseRecord", () => {
  it("round-trips", () => {
    const r = createRecord({ functional: true, analytics: false }, "custom", NOW);
    expect(parseRecord(JSON.stringify(r))).toEqual(r);
  });

  it.each([null, "", "not json", "null", "42", "[]", JSON.stringify({ schema: 2 }), JSON.stringify({ schema: 1, policyVersion: POLICY_VERSION })])(
    "treats %s as no decision",
    (raw) => {
      expect(parseRecord(raw)).toBeNull();
    },
  );

  it("rejects bad dates", () => {
    const r = { ...createRecord(allChoices(true), "accept-all", NOW), decidedAt: "yesterday" };
    expect(parseRecord(JSON.stringify(r))).toBeNull();
  });

  it("only literal true grants a category", () => {
    const r = { ...createRecord(allChoices(false), "custom", NOW), choices: { functional: "yes", analytics: 1 } };
    expect(parseRecord(JSON.stringify(r))?.choices).toEqual({ functional: false, analytics: false });
  });
});

describe("grant (click-to-load)", () => {
  it("adds categories and keeps the others", () => {
    const base = createRecord({ functional: true, analytics: false }, "custom", NOW);
    const r = grant(base, ["analytics"], days(1));
    expect(r.choices).toEqual({ functional: true, analytics: true });
    expect(r.method).toBe("embed");
    expect(r.decidedAt).toBe(days(1).toISOString());
  });

  it("never revives an expired yes", () => {
    const old = createRecord(allChoices(true), "accept-all", NOW);
    const r = grant(old, ["analytics"], days(CONSENT_MAX_AGE_DAYS + 5));
    expect(r.choices).toEqual({ functional: false, analytics: true });
  });

  it("works with no prior decision", () => {
    expect(grant(null, ["functional", "analytics"], NOW).choices).toEqual({ functional: true, analytics: true });
  });
});

describe("withdrawn", () => {
  it("lists categories switched off", () => {
    expect(withdrawn(allChoices(true), { functional: false, analytics: true })).toEqual(["functional"]);
    expect(withdrawn(allChoices(false), allChoices(true))).toEqual([]);
  });
});

describe("allowsAll (simulator gating)", () => {
  it("needs every listed category", () => {
    const r = createRecord({ functional: true, analytics: false }, "custom", NOW);
    expect(allowsAll(r, ["functional"], NOW)).toBe(true);
    expect(allowsAll(r, ["functional", "analytics"], NOW)).toBe(false);
    expect(allowsAll(r, [], NOW)).toBe(true);
  });
});

describe("registry", () => {
  it("has unique first-party names", () => {
    const names = FIRST_PARTY_ITEMS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("the consent record itself is strictly necessary", () => {
    expect(FIRST_PARTY_ITEMS.find((i) => i.name === "electricademy.consent")?.category).toBe("necessary");
  });

  it("every simulator requires each optional category its items use", () => {
    for (const [slug, embed] of Object.entries(SIMULATOR_EMBEDS)) {
      for (const item of embed.items) {
        if (item.category !== "necessary") expect(embed.requires, slug).toContain(item.category);
      }
    }
  });
});
