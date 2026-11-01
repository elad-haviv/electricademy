import { describe, expect, it } from "vitest";
import { ANONYMOUS_ACCESS, can, FEATURES, FEATURE_RULES } from "./features";

const free = { plan: "free" as const, entitlements: new Set<string>() };
const pro = { plan: "pro" as const, entitlements: new Set<string>() };

describe("can", () => {
  it("lets anonymous users read and learn the basics", () => {
    expect(can(ANONYMOUS_ACCESS, "lessons.basic")).toBe(true);
    expect(can(ANONYMOUS_ACCESS, "community.read")).toBe(true);
    expect(can(ANONYMOUS_ACCESS, "community.post")).toBe(false);
  });

  it("requires pro for advanced features", () => {
    expect(can(free, "tools.professional")).toBe(false);
    expect(can(pro, "tools.professional")).toBe(true);
    expect(can(pro, "community.post")).toBe(true);
  });

  it("requires a product entitlement, regardless of plan", () => {
    expect(can(pro, "license_exam")).toBe(false);
    expect(can({ plan: "free", entitlements: new Set(["license_exam"]) }, "license_exam")).toBe(true);
  });

  it("has a rule for every feature", () => {
    for (const f of FEATURES) expect(FEATURE_RULES[f]).toBeDefined();
  });
});
