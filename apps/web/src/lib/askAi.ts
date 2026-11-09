import "server-only";
import { sql } from "drizzle-orm";
import { getLegislationEntry, loadExamBank, readLegislationSource } from "@electricademy/content";
import { dayKey } from "@electricademy/auth/content-guard";
import { getDb, rateLimitCounters } from "@electricademy/db";
import { ASK_LIMITS, buildAskMessages, sectionText, type AskMessage, type QuestionContext } from "./askAiContext";
import { plainText } from "./richText";

/**
 * "Ask the AI" about one license-exam question, through OpenRouter (docs/ARCHITECTURE.md, "AI tutor").
 * Configured by environment variables; the feature is hidden until both are set:
 *   OPENROUTER_API_KEY   the API key
 *   OPENROUTER_MODEL     the model id, e.g. "anthropic/claude-sonnet-4.5"
 *   AI_LIMIT_USER_PER_DAY  messages per user per day (default 30)
 *   OPENROUTER_REASONING_EFFORT  for reasoning models: none | minimal | low | medium | high (default low)
 *   OPENROUTER_BASE_URL  only to point tests at a mock (default https://openrouter.ai/api/v1)
 */
export function aiConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!apiKey || !model) return null;
  return {
    apiKey,
    model,
    baseUrl: (process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1").replace(/\/$/, ""),
    perDay: Math.max(1, Number(process.env.AI_LIMIT_USER_PER_DAY) || 30),
    effort: process.env.OPENROUTER_REASONING_EFFORT?.trim() || "low",
  };
}

export const aiEnabled = () => aiConfig() !== null;

/** One message from the daily AI allowance; false when today's is used up. Kept in rate_limit_counter. */
export async function takeAiMessage(userId: string, perDay: number): Promise<boolean> {
  const windowStart = new Date(`${dayKey(new Date())}T00:00:00Z`);
  try {
    const rows = await getDb()
      .insert(rateLimitCounters)
      .values({ key: `ai:u:${userId}`, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimitCounters.key, rateLimitCounters.windowStart],
        set: { count: sql`${rateLimitCounters.count} + 1` },
        setWhere: sql`${rateLimitCounters.count} < ${perDay}`,
      })
      .returning({ count: rateLimitCounters.count });
    return rows.length > 0;
  } catch (err) {
    console.error("[ask-ai] daily counter failed, allowing the message", err);
    return true;
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
 * server-sent events; this turns its `data:` lines into a stream of text deltas.
 */
export async function streamAnswer(ctx: QuestionContext, conversation: AskMessage[], signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const cfg = aiConfig();
  if (!cfg) throw new Error("AI is not configured");
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter's optional attribution headers
      "HTTP-Referer": process.env.AUTH_URL || "https://electricademy.haviv.pro",
      "X-Title": "Electricademy",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: buildAskMessages(ctx, conversation),
      stream: true,
      temperature: 0.2, // ignored by models that don't take it
      // reasoning models count their thinking in max_tokens: keep it light, leave room for the reply,
      // and don't stream the thinking itself (only `content` is read below)
      reasoning: { effort: cfg.effort, exclude: true },
      max_tokens: 4000,
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = "";
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        let emitted = false;
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : null;
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
            if (json.error) throw new Error(json.error.message ?? "OpenRouter error");
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
              emitted = true;
            }
          } catch (err) {
            if (err instanceof SyntaxError) continue; // keep-alive comments and partial lines
            controller.error(err);
            return;
          }
        }
        if (emitted) return;
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}
