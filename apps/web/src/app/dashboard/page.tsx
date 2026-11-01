import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { lessonPath, TRACKS } from "@electricademy/content";
import { getDb, lessonProgress, users } from "@electricademy/db";
import { Badge, buttonClass, Card, SectionHeading } from "@electricademy/ui";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "האזור שלי" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");
  const { checkout } = await searchParams;
  const db = getDb();
  const [progress, [profile], access] = await Promise.all([
    db.select({ path: lessonProgress.lessonPath }).from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
    db.select({ xp: users.xp }).from(users).where(eq(users.id, user.id)),
    getCurrentAccess(),
  ]);
  const done = new Set(progress.map((p) => p.path));

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
    </div>
  );
}
