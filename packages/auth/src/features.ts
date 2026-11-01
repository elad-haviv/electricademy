/**
 * Every gated capability in the platform. Add new features here, then decide
 * which plan or product unlocks them in FEATURE_RULES.
 */
export const FEATURES = [
  "lessons.basic",
  "lessons.advanced",
  "community.read",
  "community.post",
  "tools.basic",
  "tools.professional",
  "simulators.free",
  "simulators.pro",
  "exams.practice",
  "license_exam",
  "blue_grid",
] as const;

export type Feature = (typeof FEATURES)[number];
export type Plan = "anonymous" | "free" | "pro";

export interface Access {
  plan: Plan;
  /** Separately purchased products / grants, e.g. "license_exam". */
  entitlements: ReadonlySet<string>;
}

type Rule = { minPlan: Plan } | { entitlement: string };

const PLAN_RANK: Record<Plan, number> = { anonymous: 0, free: 1, pro: 2 };

export const FEATURE_RULES: Record<Feature, Rule> = {
  "lessons.basic": { minPlan: "anonymous" },
  "lessons.advanced": { minPlan: "pro" },
  "community.read": { minPlan: "anonymous" },
  "community.post": { minPlan: "free" },
  "tools.basic": { minPlan: "anonymous" },
  "tools.professional": { minPlan: "pro" },
  "simulators.free": { minPlan: "anonymous" },
  "simulators.pro": { minPlan: "pro" },
  "exams.practice": { minPlan: "pro" },
  license_exam: { entitlement: "license_exam" },
  blue_grid: { entitlement: "blue_grid" },
};

/** Single source of truth for authorization of gated features. */
export function can(access: Access, feature: Feature): boolean {
  const rule = FEATURE_RULES[feature];
  if ("minPlan" in rule) return PLAN_RANK[access.plan] >= PLAN_RANK[rule.minPlan];
  return access.entitlements.has(rule.entitlement);
}

export const ANONYMOUS_ACCESS: Access = { plan: "anonymous", entitlements: new Set() };
