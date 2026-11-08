import { aiConfig, questionContext, streamAnswer, takeAiMessage } from "@/lib/askAi";
import { sanitizeConversation } from "@/lib/askAiContext";
import { guardExamContent, logContentAbuse } from "@/lib/contentGuard";
import { getSessionUser } from "@/lib/session";

/**
 * POST /api/license-exam/ask  { n: number, messages: [{ role, content }] }  →  text/plain stream
 * The AI tutor for one bank question (lib/askAi.ts). Signed-in only; a chat about a question counts as
 * opening its answer in the daily content budget (lib/contentGuard.ts), and each message also uses the
 * learner's daily AI allowance. Errors come back as JSON { error, retry? } with a Hebrew message.
 */
export async function POST(request: Request) {
  const fail = (status: number, error: string, retry?: "minute" | "day") =>
    Response.json({ error, ...(retry ? { retry } : {}) }, { status, headers: { "Cache-Control": "no-store" } });

  const cfg = aiConfig();
  if (!cfg) return fail(503, "ההתייעצות עם AI עוד לא הופעלה באתר.");
  const user = await getSessionUser().catch(() => null);
  if (!user) return fail(401, "צריך להתחבר כדי להתייעץ עם AI.");

  const body = (await request.json().catch(() => null)) as { n?: unknown; messages?: unknown } | null;
  const n = Number(body?.n);
  const conversation = sanitizeConversation(body?.messages);
  const ctx = Number.isInteger(n) && n > 0 ? questionContext(n) : null;
  if (!ctx || !conversation) return fail(400, "הבקשה לא תקינה. רעננו את הדף ונסו שוב.");

  // talking about the answer reveals it: same budget as "show answer"
  const guard = await guardExamContent(user.id, { view: [n], answer: [n] });
  if (!guard.ok) return fail(429, guard.message, guard.retry);
  if (!(await takeAiMessage(user.id, cfg.perDay))) {
    await logContentAbuse(user.id, null, "ai-messages-per-day");
    return fail(429, `הגעתם למכסה היומית של התייעצויות עם AI (${cfg.perDay} הודעות). מחר בחצות היא מתחדשת.`, "day");
  }

  try {
    const stream = await streamAnswer(ctx, conversation, request.signal);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  } catch (err) {
    console.error("[ask-ai] request failed", err);
    return fail(502, "שירות ה-AI לא זמין כרגע. נסו שוב בעוד כמה דקות.");
  }
}
