import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { hasLesson, lessonPath, TRACKS } from "@electricademy/content";
import { getDb, lessonProgress, users } from "@electricademy/db";
import { Badge, buttonClass, Card, IconArrowLeft, IconZap, Notice, ProgressBar, SectionHeading } from "@electricademy/ui";
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

  // The first unfinished, published lesson in the most recently started track (or Basics).
  const startedTrack = TRACKS.find((t) => t.modules.some((m) => m.lessons.some((l) => done.has(lessonPath(t.slug, m.slug, l.slug)))));
  const resumeTrack = startedTrack ?? TRACKS[0]!;
  const resume = resumeTrack.modules
    .flatMap((m) => m.lessons.map((l) => ({ m, l })))
    .find(({ m, l }) => hasLesson(resumeTrack.slug, m.slug, l.slug) && !done.has(lessonPath(resumeTrack.slug, m.slug, l.slug)));

  return (
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        title={`שלום, ${user.name ?? "חבר/ה"}`}
        subtitle="כאן רואים את ההתקדמות שלכם בכל המסלולים."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="brand">
              <IconZap className="size-3.5" />
              {profile?.xp ?? 0} XP
            </Badge>
            {access.plan === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge>חינם</Badge>}
          </div>
        }
      />
      {checkout === "success" && <Notice tone="success">התשלום התקבל, תודה!</Notice>}
      {resume && (
        <Link
          href={`/tracks/${resumeTrack.slug}/${resume.m.slug}/${resume.l.slug}`}
          className="group flex flex-col gap-4 rounded-3xl bg-navy-900 p-6 text-white shadow-(--shadow-raised) sm:flex-row sm:items-center sm:p-8"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-spark-300">{startedTrack ? "ממשיכים מאיפה שעצרתם" : "מתחילים כאן"}</p>
            <p className="mt-1 text-2xl font-extrabold">{resume.l.title}</p>
            <p className="mt-1 text-brand-100">
              {resumeTrack.title} · {resume.m.title}
            </p>
          </div>
          <span className={buttonClass("spark", "self-start sm:self-center", "lg")}>
            {startedTrack ? "להמשיך" : "להתחיל"}
            <IconArrowLeft className="size-5 transition group-hover:-translate-x-0.5" />
          </span>
        </Link>
      )}
      <h2 className="text-xl font-extrabold">ההתקדמות שלי</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => {
          const paths = t.modules.flatMap((m) => m.lessons.map((l) => lessonPath(t.slug, m.slug, l.slug)));
          const completed = paths.filter((p) => done.has(p)).length;
          const pct = paths.length ? Math.round((completed / paths.length) * 100) : 0;
          return (
            <Card key={t.slug}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{t.title}</h3>
                <span className="text-sm font-semibold text-slate-600 tabular-nums dark:text-slate-400">
                  {completed}/{paths.length}
                </span>
              </div>
              <ProgressBar className="mt-3" value={pct} label={`התקדמות במסלול ${t.title}`} />
              <Link href={`/tracks/${t.slug}`} className={buttonClass("ghost", "mt-3 -ms-3 text-brand-700 dark:text-brand-300", "sm")}>
                {completed > 0 ? "להמשיך במסלול" : "לצפייה במסלול"}
                <IconArrowLeft className="size-4" />
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
