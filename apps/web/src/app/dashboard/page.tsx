import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { lessonPath, TRACKS } from "@electricademy/content";
import { getDb, lessonProgress, users } from "@electricademy/db";
import { Badge, buttonClass, Card, SectionHeading } from "@electricademy/ui";
import { formatDate } from "@/lib/labels";
import { getCurrentAccess, getSessionUser } from "@/lib/session";
import { listSimEvents, listSimulators } from "@/lib/simulators";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "האזור שלי" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");
  const { checkout } = await searchParams;
  const db = getDb();
  const [progress, [profile], access, simEvents, sims] = await Promise.all([
    db.select({ path: lessonProgress.lessonPath }).from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
    db.select({ xp: users.xp }).from(users).where(eq(users.id, user.id)),
    getCurrentAccess(),
    listSimEvents(user.id),
    listSimulators(),
  ]);
  const done = new Set(progress.map((p) => p.path));
  const labs = summarizeLabs(simEvents);

  return (
    <div className="space-y-8">
      <SectionHeading
        title={`שלום, ${user.name ?? "חבר/ה"} 👋`}
        subtitle="כאן רואים את ההתקדמות שלכם בכל המסלולים."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="brand">⚡ {profile?.xp ?? 0} XP</Badge>
            {access.plan === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge>חינם</Badge>}
          </div>
        }
      />
      {checkout === "success" && <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">התשלום התקבל, תודה!</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => {
          const paths = t.modules.flatMap((m) => m.lessons.map((l) => lessonPath(t.slug, m.slug, l.slug)));
          const completed = paths.filter((p) => done.has(p)).length;
          const pct = paths.length ? Math.round((completed / paths.length) * 100) : 0;
          return (
            <Card key={t.slug}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">
                  {t.icon} {t.title}
                </h2>
                <span className="text-sm text-slate-500">
                  {completed}/{paths.length}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`התקדמות במסלול ${t.title}`}
              >
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
              <Link href={`/tracks/${t.slug}`} className={buttonClass("ghost", "mt-3 -ms-3")}>
                {completed > 0 ? "להמשיך ←" : "להתחיל ←"}
              </Link>
            </Card>
          );
        })}
      </div>

      <section>
        <SectionHeading
          title="המעבדות שלי"
          subtitle="סימולטורים שנכנסתם אליהם מתוך האתר, ומודולים שהשלמתם בהם."
          action={
            <Link href="/simulators" className={buttonClass("ghost")}>
              לכל הסימולטורים ←
            </Link>
          }
        />
        {labs.size === 0 ? (
          <Card className="text-sm text-slate-600 dark:text-slate-400">
            עוד לא נכנסתם לאף מעבדה. כשתפתחו סימולטור מתוך האתר, ההתקדמות תופיע כאן.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sims
              .filter((sim) => labs.has(sim.slug))
              .map((sim) => {
                const lab = labs.get(sim.slug)!;
                return (
                  <Card key={sim.slug} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold">{sim.name}</h3>
                      <span className="text-xs text-slate-500">כניסה אחרונה: {formatDate(lab.lastAt.toISOString())}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {lab.visits === 1 ? "כניסה אחת" : `${lab.visits} כניסות`} ·{" "}
                      {lab.completed.size === 1 ? "מודול אחד הושלם" : `${lab.completed.size} מודולים הושלמו`}
                    </p>
                    {lab.modules.size > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {[...lab.modules].map(([mod, pct]) => (
                          <li key={mod}>
                            <Badge tone={lab.completed.has(mod) ? "success" : "neutral"}>
                              <bdi>{mod}</bdi> · {lab.completed.has(mod) ? "הושלם" : `${Math.round(pct)}%`}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/simulators/${sim.slug}`} className={buttonClass("ghost", "-ms-3 self-start")}>
                      להמשיך ←
                    </Link>
                  </Card>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}

interface LabSummary {
  lastAt: Date;
  visits: number;
  /** Best progress per module (0–100). */
  modules: Map<string, number>;
  completed: Set<string>;
}

/** Folds the raw sim_session log (latest first) into one summary per simulator. */
function summarizeLabs(events: { slug: string; event: string; payload: Record<string, unknown> | null; at: Date }[]) {
  const labs = new Map<string, LabSummary>();
  for (const e of events) {
    let lab = labs.get(e.slug);
    if (!lab) labs.set(e.slug, (lab = { lastAt: e.at, visits: 0, modules: new Map(), completed: new Set() }));
    const mod = typeof e.payload?.module === "string" ? e.payload.module : null;
    if (e.event === "opened") lab.visits += 1;
    if (mod && e.event === "progress") lab.modules.set(mod, Math.max(lab.modules.get(mod) ?? 0, Number(e.payload?.percent) || 0));
    if (mod && e.event === "completed") {
      lab.completed.add(mod);
      lab.modules.set(mod, 100);
    }
  }
  return labs;
}
