/**
 * AI tutor tiers and token budgets (pure, unit-tested). Paying learners and free learners can get a different
 * model and a different daily token allowance; everything is set by environment variables:
 *
 *   OPENROUTER_API_KEY            the key (shared by both tiers)
 *   AI_MODEL_FREE / AI_MODEL_PRO  OpenRouter model id per tier; OPENROUTER_MODEL is the fallback for both.
 *                                 A tier with no model has no AI tutor.
 *   AI_TOKENS_PER_DAY_FREE        tokens (prompt + reply + reasoning) per learner per day, free tier (default 20000)
 *   AI_TOKENS_PER_DAY_PRO         same for paying learners (default 150000)
 *   AI_TOKENS_PER_DAY_TOTAL       optional cap for the whole site per day, all learners together
 *   OPENROUTER_REASONING_EFFORT   for reasoning models: none | minimal | low | medium | high (default low)
 */
import type { Access } from "@electricademy/auth";

export type AiTier = "free" | "pro";

export interface TierSettings {
  tier: AiTier;
  model: string;
  tokensPerDay: number;
}

type Env = Record<string, string | undefined>;

const DEFAULT_TOKENS: Record<AiTier, number> = { free: 20_000, pro: 150_000 };
/** Upper bound for one reply (reasoning included); a small cap can leave a reasoning model with no reply. */
export const MAX_REPLY_TOKENS = 4000;
/** Below this many tokens left for today, a new message is refused rather than cut short. */
export const MIN_TOKENS_TO_START = 1500;

/** Paying: a Pro subscription, or the license-exam product bought on its own. */
export function tierFor(access: Pick<Access, "plan" | "entitlements">): AiTier {
  return access.plan === "pro" || access.entitlements.has("license_exam") ? "pro" : "free";
}

const positive = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

export function tierSettings(env: Env, tier: AiTier): TierSettings | null {
  if (!env.OPENROUTER_API_KEY?.trim()) return null;
  const model = (tier === "pro" ? env.AI_MODEL_PRO : env.AI_MODEL_FREE)?.trim() || env.OPENROUTER_MODEL?.trim();
  if (!model) return null;
  const tokensPerDay = positive(tier === "pro" ? env.AI_TOKENS_PER_DAY_PRO : env.AI_TOKENS_PER_DAY_FREE) ?? DEFAULT_TOKENS[tier];
  return { tier, model, tokensPerDay };
}

export const siteTokensPerDay = (env: Env) => positive(env.AI_TOKENS_PER_DAY_TOTAL);

/** The reply cap for one request, given what is left of today's allowance. */
export function replyTokenCap(remaining: number): number {
  return Math.max(300, Math.min(MAX_REPLY_TOKENS, remaining));
}

/** A rough token count for text we sent or received, when the provider's usage report is missing (aborted streams). */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 3);
}

export interface SseEvent {
  delta?: string;
  usage?: { tokens: number; costUsd: number | null };
  error?: string;
}

/**
 * One line of OpenRouter's chat-completions stream. The last chunk before [DONE] carries `usage`
 * (prompt, completion and reasoning tokens, and `cost` in USD).
 */
export function parseSseLine(line: string): SseEvent | null {
  if (!line.startsWith("data:")) return null;
  const data = line.slice(5).trim();
  if (!data || data === "[DONE]") return null;
  let json: {
    choices?: { delta?: { content?: string } }[];
    usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number; cost?: number };
    error?: { message?: string };
  };
  try {
    json = JSON.parse(data);
  } catch {
    return null; // keep-alive comments and partial lines
  }
  if (json.error) return { error: json.error.message ?? "OpenRouter error" };
  const out: SseEvent = {};
  const delta = json.choices?.[0]?.delta?.content;
  if (delta) out.delta = delta;
  if (json.usage) {
    const u = json.usage;
    const tokens = u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0);
    out.usage = { tokens, costUsd: typeof u.cost === "number" ? u.cost : null };
  }
  return out;
}
