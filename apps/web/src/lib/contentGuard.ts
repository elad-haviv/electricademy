import "server-only";
import { headers } from "next/headers";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { clientIp, contentLimitsFromEnv, dayKey, ipBucket, planBudget } from "@electricademy/auth/content-guard";
import { contentAbuseEvents, examContentAccess, getDb, rateLimitCounters } from "@electricademy/db";

/**
 * Per-user and per-IP limits on the license-exam bank (docs/ARCHITECTURE.md, "Content protection").
 * Two kinds of limit, both kept in Postgres so they hold across instances and restarts:
 *  - a request rate per minute (fixed window);
 *  - a daily budget of distinct questions seen ("view") and answers opened ("answer").
 * If the database is unreachable the guard lets the request through (and logs it): an outage should
 * not lock honest learners out of practice.
 */

export type GuardKind = "view" | "answer";

export interface LimitHit {
  ok: false;
  /** Which limit refused the request, for the abuse log. */
  reason: string;
  /** "minute": try again shortly; "day": the budget resets at midnight. */
  retry: "minute" | "day";
  /** Hebrew, shown as is. */
  message: string;
}

export type GuardResult = { ok: true } | LimitHit;

const MESSAGES = {
  minute: "הגיעו הרבה בקשות בזמן קצר. אפשר להמשיך בעוד דקה, וכל מה שעשיתם נשמר בדף.",
  view: "הגעתם למכסה היומית של שאלות חדשות. השאלות שכבר פתחתם היום זמינות, ומחר בחצות המכסה מתחדשת.",
  answer: "הגעתם למכסה היומית של תשובות והסברים. מחר בחצות המכסה מתחדשת, ובינתיים אפשר לתרגל בלי לבדוק.",
  ip: "מהרשת שאתם מחוברים ממנה נפתחו היום הרבה שאלות. מחר בחצות המכסה מתחדשת.",
} as const;

function limitHit(reason: string, retry: LimitHit["retry"], message: string): LimitHit {
  return { ok: false, reason, retry, message };
}

/** The visitor's IP as our proxies saw it (see clientIp for which header is trusted). */
export async function requestIp(): Promise<string | null> {
  const h = await headers();
  return clientIp((name) => h.get(name), {
    header: process.env.CLIENT_IP_HEADER || undefined,
    hops: Number(process.env.TRUSTED_PROXY_HOPS) || 1,
  });
}

/** Adds one to a fixed one-minute window; false when the window is already full. */
async function takeToken(key: string, limit: number, now: Date): Promise<boolean> {
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const rows = await getDb()
    .insert(rateLimitCounters)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitCounters.key, rateLimitCounters.windowStart],
      set: { count: sql`${rateLimitCounters.count} + 1` },
      setWhere: sql`${rateLimitCounters.count} < ${limit}`,
    })
    .returning({ count: rateLimitCounters.count });
  return rows.length > 0;
}

/**
 * Checks and records one request for bank content by a signed-in user: the per-minute rates, then the daily
 * budgets for the questions it shows (`view`) and the answers it reveals (`answer`). Nothing is recorded
 * when a limit refuses the request. `force` records the questions without checking the budgets (grading an
 * exam whose answers were reserved when it was drawn).
 */
export async function guardExamContent(
  userId: string,
  need: Partial<Record<GuardKind, number[]>>,
  opts: { force?: boolean; rate?: boolean } = {},
): Promise<GuardResult> {
  const limits = contentLimitsFromEnv(process.env);
  const now = new Date();
  const ip = await requestIp().catch(() => null);
  const ipKey = ip ? ipBucket(ip) : null;
  const userSubject = `u:${userId}`;
  const ipSubject = ipKey ? `ip:${ipKey}` : null;
  try {
    if (opts.rate !== false) {
      if (!(await takeToken(userSubject, limits.userPerMinute, now))) return logged(userId, ip, limitHit("user-per-minute", "minute", MESSAGES.minute));
      if (ipSubject && !(await takeToken(ipSubject, limits.ipPerMinute, now)))
        return logged(userId, ip, limitHit("ip-per-minute", "minute", MESSAGES.minute));
    }

    const day = dayKey(now);
    const kinds = (["view", "answer"] as const).filter((k) => need[k]?.length);
    if (kinds.length === 0) return { ok: true };
    const subjects = [
      { subject: userSubject, who: "user" as const, limit: { view: limits.userViewsPerDay, answer: limits.userAnswersPerDay } },
      ...(ipSubject ? [{ subject: ipSubject, who: "ip" as const, limit: { view: limits.ipViewsPerDay, answer: limits.ipAnswersPerDay } }] : []),
    ];

    const result = await getDb().transaction(async (tx) => {
      // one budget check at a time per subject, so parallel requests cannot both squeeze in
      for (const s of [...subjects].sort((a, b) => a.subject.localeCompare(b.subject)))
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${s.subject}))`);
      const inserts: (typeof examContentAccess.$inferInsert)[] = [];
      for (const kind of kinds) {
        for (const s of subjects) {
          const rows = await tx
            .select({ n: examContentAccess.questionN })
            .from(examContentAccess)
            .where(and(eq(examContentAccess.subject, s.subject), eq(examContentAccess.day, day), eq(examContentAccess.kind, kind)));
          const seen = new Set(rows.map((r) => r.n));
          const plan = planBudget(seen, seen.size, need[kind]!, s.limit[kind]);
          if (!plan.ok && !opts.force)
            return limitHit(`${s.who}-${kind}s-per-day`, "day", s.who === "ip" ? MESSAGES.ip : MESSAGES[kind]);
          for (const n of plan.fresh) inserts.push({ subject: s.subject, day, kind, questionN: n });
        }
      }
      if (inserts.length) await tx.insert(examContentAccess).values(inserts).onConflictDoNothing();
      return { ok: true } as const;
    });
    if (Math.random() < 0.01) void prune(now);
    return result.ok ? result : logged(userId, ip, result, { kinds, count: kinds.map((k) => need[k]!.length) });
  } catch (err) {
    console.error("[content-guard] check failed, letting the request through", err);
    return { ok: true };
  }
}

async function logged(userId: string | null, ip: string | null, hit: LimitHit, detail?: Record<string, unknown>): Promise<LimitHit> {
  await logContentAbuse(userId, ip, hit.reason, detail);
  return hit;
}

/**
 * Records a refused or suspicious request in content_abuse_event and the server log, at most once per user
 * (or IP) and reason every 10 minutes, so a scraper hammering a limit does not flood either.
 */
export async function logContentAbuse(userId: string | null, ip: string | null, reason: string, detail?: Record<string, unknown>) {
  try {
    const db = getDb();
    const since = new Date(Date.now() - 10 * 60_000);
    const who = userId ? eq(contentAbuseEvents.userId, userId) : ip ? eq(contentAbuseEvents.ip, ip) : sql`true`;
    const [recent] = await db
      .select({ id: contentAbuseEvents.id })
      .from(contentAbuseEvents)
      .where(and(who, eq(contentAbuseEvents.reason, reason), gt(contentAbuseEvents.createdAt, since)))
      .limit(1);
    if (recent) return;
    await db.insert(contentAbuseEvents).values({ userId, ip, reason, detail: detail ?? null });
    console.warn(`[content-guard] ${reason} user=${userId ?? "-"} ip=${ip ?? "-"}${detail ? ` ${JSON.stringify(detail)}` : ""}`);
  } catch (err) {
    console.error("[content-guard] could not log", reason, err);
  }
}

/** Drops access rows older than a week and counters older than a day. */
async function prune(now: Date) {
  try {
    const db = getDb();
    await db.delete(examContentAccess).where(lt(examContentAccess.day, dayKey(new Date(now.getTime() - 8 * 86_400_000))));
    await db.delete(rateLimitCounters).where(lt(rateLimitCounters.windowStart, new Date(now.getTime() - 86_400_000)));
  } catch (err) {
    console.error("[content-guard] prune failed", err);
  }
}
