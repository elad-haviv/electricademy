import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Access } from "@electricademy/auth";
import { getLegislationEntry, loadExamBank, readLegislationSource } from "@electricademy/content";
import { dayKey } from "@electricademy/auth/content-guard";
import { getDb, rateLimitCounters } from "@electricademy/db";
import { estimateTokens, parseSseLine, tierFor, tierSettings, type TierSettings } from "./aiTiers";
import { ASK_LIMITS, buildAskMessages, sectionText, type AskMessage, type QuestionContext } from "./askAiContext";
import { plainText } from "./richText";

/**
 * "Ask the AI" about one license-exam question, through OpenRouter (docs/ARCHITECTURE.md, "AI tutor").
 * Tiers, models and token budgets come from environment variables: see lib/aiTiers.ts.
 * OPENROUTER_BASE_URL exists only to point tests at a mock (default https://openrouter.ai/api/v1).
 */
const baseUrl = () => (process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1").replace(/\/$/, "");
const effort = () => process.env.OPENROUTER_REASONING_EFFORT?.trim() || "low";

/** The tutor settings for this learner's tier, or null when that tier has no AI. */
export function settingsFor(access: Access): TierSettings | null {
  return tierSettings(process.env, tierFor(access));
}

/** Whether the signed-in learner gets the ✨ at all (pages decide what to render). */
export async function aiAvailableForCurrentUser(): Promise<boolean> {
  if (!process.env.OPENROUTER_API_KEY?.trim()) return false;
  // imported here so this module (questionContext) stays testable without next-auth
  const { getCurrentAccess } = await import("./session");
  const access = await getCurrentAccess().catch(() => null);
  return access ? settingsFor(access) !== null : false;
}

/* ───────────── daily token and cost counters (rate_limit_counter, one window per day) ───────────── */

const today = () => new Date(`${dayKey(new Date())}T00:00:00Z`);
const KEY = {
  userTokens: (id: string) => `ai-tok:u:${id}`,
  userCost: (id: string) => `ai-usd-micro:u:${id}`,
  siteTokens: "ai-tok:all",
  siteCost: "ai-usd-micro:all",
};

async function readCounter(key: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: rateLimitCounters.count })
    .from(rateLimitCounters)
    .where(and(eq(rateLimitCounters.key, key), eq(rateLimitCounters.windowStart, today())));
  return row?.count ?? 0;
}

async function addCounter(key: string, amount: number) {
  if (amount <= 0) return;
  await getDb()
    .insert(rateLimitCounters)
    .values({ key, windowStart: today(), count: amount })
    .onConflictDoUpdate({ target: [rateLimitCounters.key, rateLimitCounters.windowStart], set: { count: sql`${rateLimitCounters.count} + ${amount}` } });
}

/** Tokens this learner and the whole site used today. A database error counts as zero (logged). */
export async function tokensUsedToday(userId: string): Promise<{ user: number; site: number }> {
  try {
    const [user, site] = await Promise.all([readCounter(KEY.userTokens(userId)), readCounter(KEY.siteTokens)]);
    return { user, site };
  } catch (err) {
    console.error("[ask-ai] reading usage failed", err);
    return { user: 0, site: 0 };
  }
}

/** Records one reply's usage: tokens, and cost in micro-dollars, per learner and for the site. */
export async function recordUsage(userId: string, tokens: number, costUsd: number | null) {
  try {
    const micro = costUsd ? Math.round(costUsd * 1_000_000) : 0;
    await Promise.all([
      addCounter(KEY.userTokens(userId), tokens),
      addCounter(KEY.siteTokens, tokens),
      addCounter(KEY.userCost(userId), micro),
      addCounter(KEY.siteCost, micro),
    ]);
  } catch (err) {
    console.error("[ask-ai] recording usage failed", err);
  }
}

/** This question, our key for it and the text of the regulation sections the key cites. */
export function questionContext(n: number): QuestionContext | null {
  const bank = loadExamBank();
  const q = bank.byNumber.get(n);
  if (!q) return null;
  const key = bank.answers.get(n) ?? null;
  const sections: QuestionContext["sections"] = [];
  for (const r of key?.references ?? []) {
    if (sections.length >= ASK_LIMITS.maxSections || !r.law) continue;
    const source = readLegislationSource(r.law);
    const text = source && sectionText(source, r.section);
    if (text) sections.push({ title: `${getLegislationEntry(r.law)?.wikisourceTitle ?? r.title}, סעיף ${r.section}`, text });
  }
  return {
    n,
    stem: q.stem.map(plainText).join("\n"),
    options: q.options.map((o) => plainText(o.text) || "(שרטוט)"),
    key: key && {
      answer: key.answer,
      explanation: key.explanation,
      calculation: key.calculation,
      interpretation: key.interpretation,
      note: key.note,
      confidence: key.confidence,
      references: key.references?.map((r) => ({ title: r.title, section: r.section, quote: r.quote })),
    },
    sections,
  };
}

/**
 * Streams the tutor's reply as plain text. OpenRouter speaks the OpenAI chat-completions protocol with
 * server-sent events; this turns its `data:` lines into text deltas, and reports the usage OpenRouter sends in the
 * last chunk (or an estimate, if the stream ends without one, e.g. when the learner stops it) through `onUsage`.
 */
export async function streamAnswer(
  ctx: QuestionContext,
  conversation: AskMessage[],
  opts: { model: string; maxTokens: number; signal: AbortSignal; onUsage: (tokens: number, costUsd: number | null) => void },
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("AI is not configured");
  const messages = buildAskMessages(ctx, conversation);
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter's optional attribution headers
      "HTTP-Referer": process.env.AUTH_URL || "https://electricademy.haviv.pro",
      "X-Title": "Electricademy",
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      stream: true,
      temperature: 0.2, // ignored by models that don't take it
      // reasoning models count their thinking in max_tokens: keep it light, leave room for the reply,
      // and don't stream the thinking itself (only `content` is read below)
      reasoning: { effort: effort(), exclude: true },
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }
  const promptChars = messages.reduce((n, m) => n + m.content.length, 0);
  let replyChars = 0;
  let reported = false;
  const report = (tokens: number, cost: number | null) => {
    if (reported) return;
    reported = true;
    opts.onUsage(tokens, cost);
  };
  const reportEstimate = () => report(estimateTokens(promptChars + replyChars), null);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = "";
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read().catch((err) => {
          reportEstimate();
          throw err;
        });
        if (done) {
          reportEstimate(); // no-op when the usage chunk already came
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        let emitted = false;
        for (const line of lines) {
          const ev = parseSseLine(line);
          if (!ev) continue;
          if (ev.error) {
            reportEstimate();
            controller.error(new Error(ev.error));
            return;
          }
          if (ev.usage) report(ev.usage.tokens, ev.usage.costUsd);
          if (ev.delta) {
            replyChars += ev.delta.length;
            controller.enqueue(encoder.encode(ev.delta));
            emitted = true;
          }
        }
        if (emitted) return;
      }
    },
    cancel() {
      reportEstimate(); // the learner pressed stop: OpenRouter still bills what it generated
      void reader.cancel();
    },
  });
}
