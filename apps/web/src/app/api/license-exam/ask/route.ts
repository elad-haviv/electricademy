import { MIN_TOKENS_TO_START, replyTokenCap, siteTokensPerDay } from "@/lib/aiTiers";
import { questionContext, recordUsage, settingsFor, streamAnswer, tokensUsedToday } from "@/lib/askAi";
import { sanitizeConversation } from "@/lib/askAiContext";
import { guardExamContent, logContentAbuse } from "@/lib/contentGuard";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

/**
 * POST /api/license-exam/ask  { n: number, messages: [{ role, content }] }  →  text/plain stream
 * The AI tutor for one bank question (lib/askAi.ts). Signed-in only; a chat about a question counts as
 * opening its answer in the daily content budget (lib/contentGuard.ts). The model and the daily token
 * allowance depend on the learner's tier (lib/aiTiers.ts). Errors come back as JSON { error, retry? }
 * with a Hebrew message. Response headers X-AI-Tier, X-AI-Used and X-AI-Limit let the chat show the quota.
 */
export async function POST(request: Request) {
  const fail = (status: number, error: string, retry?: "minute" | "day", extra?: Record<string, unknown>) =>
    Response.json({ error, ...(retry ? { retry } : {}), ...extra }, { status, headers: { "Cache-Control": "no-store" } });

  if (!process.env.OPENROUTER_API_KEY?.trim()) return fail(503, "ההתייעצות עם AI עוד לא הופעלה באתר.");
  const user = await getSessionUser().catch(() => null);
  if (!user) return fail(401, "צריך להתחבר כדי להתייעץ עם AI.");
  const access = await getCurrentAccess().catch(() => null);
  const settings = access && settingsFor(access);
  if (!settings) return fail(403, "ההתייעצות עם AI זמינה כרגע רק למנויים.", undefined, { upgrade: true });

  const body = (await request.json().catch(() => null)) as { n?: unknown; messages?: unknown } | null;
  const n = Number(body?.n);
  const conversation = sanitizeConversation(body?.messages);
  const ctx = Number.isInteger(n) && n > 0 ? questionContext(n) : null;
  if (!ctx || !conversation) return fail(400, "הבקשה לא תקינה. רעננו את הדף ונסו שוב.");

  const used = await tokensUsedToday(user.id);
  const remaining = settings.tokensPerDay - used.user;
  // what is left is too little to start a reply, so the meter shows the day as used up
  if (remaining < MIN_TOKENS_TO_START) {
    await logContentAbuse(user.id, null, "ai-tokens-per-day");
    return fail(
      429,
      settings.tier === "free"
        ? "ניצלתם את מכסת ההתייעצות היומית עם AI. היא מתחדשת מחר בחצות, ובמנוי יש מכסה גדולה יותר ומודל מתקדם יותר."
        : "ניצלתם את מכסת ההתייעצות היומית עם AI. היא מתחדשת מחר בחצות.",
      "day",
      { quota: { tier: settings.tier, used: settings.tokensPerDay, limit: settings.tokensPerDay }, ...(settings.tier === "free" ? { upgrade: true } : {}) },
    );
  }
  const siteCap = siteTokensPerDay(process.env);
  if (siteCap !== null && used.site >= siteCap) {
    console.warn("[ask-ai] site-wide daily token cap reached", { siteCap, used: used.site });
    return fail(429, "ההתייעצות עם AI עמוסה היום. נסו שוב מחר.", "day");
  }

  // talking about the answer reveals it: same budget as "show answer"
  const guard = await guardExamContent(user.id, { view: [n], answer: [n] });
  if (!guard.ok) return fail(429, guard.message, guard.retry);

  try {
    const stream = await streamAnswer(ctx, conversation, {
      model: settings.model,
      maxTokens: replyTokenCap(remaining),
      signal: request.signal,
      onUsage: (tokens, cost) => void recordUsage(user.id, tokens, cost),
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "X-AI-Tier": settings.tier,
        "X-AI-Used": String(used.user),
        "X-AI-Limit": String(settings.tokensPerDay),
      },
    });
  } catch (err) {
    console.error("[ask-ai] request failed", err);
    return fail(502, "שירות ה-AI לא זמין כרגע. נסו שוב בעוד כמה דקות.");
  }
}
