import { describe, expect, it } from "vitest";
import { estimateTokens, MAX_REPLY_TOKENS, parseSseLine, replyTokenCap, siteTokensPerDay, tierFor, tierSettings } from "./aiTiers";

const access = (plan: "anonymous" | "free" | "pro", ent: string[] = []) => ({ plan, entitlements: new Set(ent) }) as Parameters<typeof tierFor>[0];

describe("tierFor", () => {
  it("pays with Pro or the license-exam product", () => {
    expect(tierFor(access("pro"))).toBe("pro");
    expect(tierFor(access("free", ["license_exam"]))).toBe("pro");
    expect(tierFor(access("free"))).toBe("free");
    expect(tierFor(access("anonymous"))).toBe("free");
  });
});

describe("tierSettings", () => {
  const base = { OPENROUTER_API_KEY: "k" };
  it("needs a key and a model", () => {
    expect(tierSettings({ AI_MODEL_FREE: "m" }, "free")).toBeNull();
    expect(tierSettings(base, "free")).toBeNull();
  });
  it("uses the tier's own model, falling back to OPENROUTER_MODEL", () => {
    const env = { ...base, AI_MODEL_PRO: "big/model", OPENROUTER_MODEL: "fallback/model" };
    expect(tierSettings(env, "pro")?.model).toBe("big/model");
    expect(tierSettings(env, "free")?.model).toBe("fallback/model");
    expect(tierSettings({ ...base, AI_MODEL_PRO: "big/model" }, "free")).toBeNull();
  });
  it("reads token budgets with defaults for missing or bad values", () => {
    const env = { ...base, OPENROUTER_MODEL: "m", AI_TOKENS_PER_DAY_FREE: "5000.7", AI_TOKENS_PER_DAY_PRO: "-1" };
    expect(tierSettings(env, "free")).toEqual({ tier: "free", model: "m", tokensPerDay: 5000 });
    expect(tierSettings(env, "pro")?.tokensPerDay).toBe(150_000);
    expect(tierSettings({ ...base, OPENROUTER_MODEL: "m" }, "free")?.tokensPerDay).toBe(20_000);
  });
  it("site cap is optional", () => {
    expect(siteTokensPerDay({})).toBeNull();
    expect(siteTokensPerDay({ AI_TOKENS_PER_DAY_TOTAL: "1000000" })).toBe(1_000_000);
  });
});

describe("replyTokenCap / estimateTokens", () => {
  it("stays between 300 and the max", () => {
    expect(replyTokenCap(100_000)).toBe(MAX_REPLY_TOKENS);
    expect(replyTokenCap(2000)).toBe(2000);
    expect(replyTokenCap(10)).toBe(300);
  });
  it("estimates about 3 characters per token", () => {
    expect(estimateTokens(10)).toBe(4);
  });
});

describe("parseSseLine", () => {
  it("reads deltas", () => {
    expect(parseSseLine('data: {"choices":[{"delta":{"content":"שלום"}}]}')).toEqual({ delta: "שלום" });
  });
  it("reads usage with cost, or sums tokens without a total", () => {
    expect(parseSseLine('data: {"choices":[],"usage":{"total_tokens":120,"cost":0.0004}}')).toEqual({ usage: { tokens: 120, costUsd: 0.0004 } });
    expect(parseSseLine('data: {"usage":{"prompt_tokens":100,"completion_tokens":20}}')).toEqual({ usage: { tokens: 120, costUsd: null } });
  });
  it("reports errors and skips the rest", () => {
    expect(parseSseLine('data: {"error":{"message":"boom"}}')).toEqual({ error: "boom" });
    expect(parseSseLine("data: [DONE]")).toBeNull();
    expect(parseSseLine(": OPENROUTER PROCESSING")).toBeNull();
    expect(parseSseLine("data: {partial")).toBeNull();
  });
});
