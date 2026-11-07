import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { can } from "@electricademy/auth";
import { getLessonMinutes, getTrack, hasLesson, lessonPath, type Track } from "@electricademy/content";
import { getDb, lessonProgress } from "@electricademy/db";
import { Badge, buttonClass, Card, cn } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { LawCallout } from "@/components/law/LawCallout";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

// Per-user progress is read on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const track = getTrack((await params).track);
  return { title: track?.title, description: track?.description };
}

type LessonState = "done" | "next" | "open" | "soon";

interface LessonView {
  slug: string;
  title: string;
  href: string;
  number: string;
  minutes: number | null;
  state: LessonState;
}

interface ModuleView {
  slug: string;
  title: string;
  description: string;
  lessons: LessonView[];
  done: number;
  minutes: number;
}

/** Joins the catalog with what's written on disk and what this user has finished. */
function buildView(track: Track, done: Set<string>) {
  let next: LessonView | undefined;
  const modules: ModuleView[] = track.modules.map((m, mi) => {
    const lessons = m.lessons.map((l, li): LessonView => {
      const path = lessonPath(track.slug, m.slug, l.slug);
      const ready = hasLesson(track.slug, m.slug, l.slug);
      const view: LessonView = {
        slug: l.slug,
        title: l.title,
        href: `/tracks/${path}`,
        number: `${mi + 1}.${li + 1}`,
        minutes: ready ? getLessonMinutes(track.slug, m.slug, l.slug) : null,
        state: done.has(path) ? "done" : ready ? "open" : "soon",
      };
      if (view.state === "open" && !next) {
        view.state = "next";
        next = view;
      }
      return view;
    });
    return {
      slug: m.slug,
      title: m.title,
      description: m.description,
      lessons,
      done: lessons.filter((l) => l.state === "done").length,
      minutes: lessons.reduce((sum, l) => sum + (l.minutes ?? 0), 0),
    };
  });
  const total = modules.reduce((n, m) => n + m.lessons.length, 0);
  const completed = modules.reduce((n, m) => n + m.done, 0);
  return {
    modules,
    next,
    total,
    completed,
    minutes: modules.reduce((n, m) => n + m.minutes, 0),
    pct: total ? Math.round((completed / total) * 100) : 0,
  };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const track = getTrack((await params).track);
  if (!track) notFound();

  const [user, access] = await Promise.all([getSessionUser(), getCurrentAccess()]);
  const done = new Set<string>();
  if (user) {
    const rows = await getDb()
      .select({ path: lessonProgress.lessonPath })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, user.id));
    for (const r of rows) if (r.path.startsWith(`${track.slug}/`)) done.add(r.path);
  }
  const locked = !can(access, track.tier === "pro" ? "lessons.advanced" : "lessons.basic");
  const view = buildView(track, done);
  // The module holding the next lesson opens by default; otherwise the first one.
  const openModule = view.modules.find((m) => m.lessons.some((l) => l.state === "next"))?.slug ?? view.modules[0]?.slug;

  return (
    <div className="space-y-6">
      <nav aria-label="פירורי לחם" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
          דף הבית
        </Link>
        <span aria-hidden>‹</span>
        <Link href="/tracks" className="hover:text-brand-700 dark:hover:text-brand-300">
          מסלולים
        </Link>
        <span aria-hidden>‹</span>
        <span aria-current="page" className="text-slate-700 dark:text-slate-300">
          {track.title}
        </span>
      </nav>

      <PageBanner
        title={track.title}
        subtitle={track.description}
        image={track.image}
        eyebrow={
          <span className="flex items-center gap-2 text-sm text-brand-200">
            {track.audience}
            {track.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
          </span>
        }
      >
        <ul className="mt-2 flex flex-wrap gap-2 text-sm text-brand-100">
          <MetaChip>{view.modules.length} מודולים</MetaChip>
          <MetaChip>{view.total} שיעורים</MetaChip>
          {view.minutes > 0 && <MetaChip>{formatDuration(view.minutes)}</MetaChip>}
        </ul>
      </PageBanner>

      {(track.slug === "licensing" || track.slug === "professionals") && <LawCallout />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="modules-heading" className="space-y-3">
          <h2 id="modules-heading" className="text-xl font-bold">
            מודולים ושיעורים
          </h2>
          {view.modules.map((m, mi) => (
            <ModuleCard key={m.slug} module={m} index={mi} defaultOpen={m.slug === openModule} locked={locked} />
          ))}
        </section>

        <aside className="order-first space-y-4 lg:sticky lg:top-20 lg:order-none" aria-label="ההתקדמות שלי">
          <Card className="space-y-5">
            <div className="flex items-center gap-4">
              <ProgressRing pct={view.pct} />
              <div className="min-w-0">
                <p className="font-bold">ההתקדמות שלך</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user ? `${view.completed} מתוך ${view.total} שיעורים` : "התחברו כדי לשמור התקדמות"}
                </p>
              </div>
            </div>
            <ContinueCta track={track} next={view.next} started={view.completed > 0} locked={locked} loggedIn={Boolean(user)} />
          </Card>

          <Card className="hidden lg:block">
            <p className="mb-3 text-sm font-semibold text-slate-500">מפת המסלול</p>
            <ol className="relative space-y-3 before:absolute before:inset-y-2 before:start-[7px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
              {view.modules.map((m) => {
                const complete = m.done === m.lessons.length && m.lessons.length > 0;
                const current = m.slug === openModule && !complete;
                return (
                  <li key={m.slug} className="relative flex items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "relative z-10 grid size-[15px] shrink-0 place-items-center rounded-full ring-2 ring-white dark:ring-slate-900",
                        complete ? "bg-emerald-500" : current ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-700",
                      )}
                    >
                      {complete && <CheckIcon className="size-2.5 text-white" />}
                    </span>
                    <a
                      href={`#module-${m.slug}`}
                      className={cn(
                        "flex-1 truncate text-sm hover:text-brand-700 dark:hover:text-brand-300",
                        current ? "font-semibold" : "text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {m.title}
                    </a>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {m.done}/{m.lessons.length}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ContinueCta({
  track,
  next,
  started,
  locked,
  loggedIn,
}: {
  track: Track;
  next: LessonView | undefined;
  started: boolean;
  locked: boolean;
  loggedIn: boolean;
}) {
  if (locked) {
    return (
      <Link href="/pricing" className={buttonClass("primary", "w-full")}>
        🔒 פתיחת המסלול עם Pro
      </Link>
    );
  }
  if (!next) {
    return started ? (
      <p className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        סיימתם את כל השיעורים הזמינים 🎉
      </p>
    ) : (
      <p className="text-center text-sm text-slate-500">השיעורים בהכנה. בקרוב!</p>
    );
  }
  return (
    <div className="space-y-2">
      <Link
        href={next.href}
        className={buttonClass(
          "primary",
          "w-full bg-spark-400 py-3 text-base text-slate-900 shadow-[0_0_24px_-6px] shadow-spark-400 hover:bg-spark-300",
        )}
      >
        {started ? "המשך ללמוד" : "להתחיל ללמוד"} ←
      </Link>
      <p className="truncate text-center text-xs text-slate-500">
        הבא בתור: {next.number} {next.title}
      </p>
      {!loggedIn && (
        <Link
          href={`/login?callbackUrl=/tracks/${track.slug}`}
          className="block text-center text-xs font-medium text-brand-700 dark:text-brand-300"
        >
          התחברות
        </Link>
      )}
    </div>
  );
}

function ModuleCard({
  module: m,
  index,
  defaultOpen,
  locked,
}: {
  module: ModuleView;
  index: number;
  defaultOpen: boolean;
  locked: boolean;
}) {
  const complete = m.lessons.length > 0 && m.done === m.lessons.length;
  const inProgress = !complete && m.done > 0;
  const comingSoon = m.lessons.every((l) => l.state === "soon");
  return (
    <details
      id={`module-${m.slug}`}
      open={defaultOpen}
      className={cn(
        "group scroll-mt-20 rounded-(--radius-card) bg-white ring-1 ring-slate-200 transition open:shadow-sm dark:bg-slate-900 dark:ring-slate-800",
        defaultOpen && "open:ring-brand-300 dark:open:ring-brand-800",
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
            complete
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
          )}
        >
          {complete ? <CheckIcon className="size-5" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">
            מודול {index + 1}: {m.title}
          </h3>
          <p className="text-sm text-slate-500">
            {m.lessons.length} שיעורים{m.minutes > 0 && ` · ${formatDuration(m.minutes)}`}
          </p>
        </div>
        {complete ? (
          <Badge tone="success">הושלם</Badge>
        ) : inProgress ? (
          <Badge tone="brand">
            בלמידה · {m.done}/{m.lessons.length}
          </Badge>
        ) : comingSoon ? (
          <Badge>בקרוב</Badge>
        ) : null}
        <ChevronIcon className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>

      <div className="px-5 pb-5">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
        <ol className="relative space-y-2 before:absolute before:inset-y-4 before:start-[15px] before:w-0.5 before:rounded-full before:bg-slate-100 dark:before:bg-slate-800">
          {m.lessons.map((l) => (
            <LessonRow key={l.slug} lesson={l} locked={locked} />
          ))}
        </ol>
      </div>
    </details>
  );
}

function LessonRow({ lesson: l, locked }: { lesson: LessonView; locked: boolean }) {
  const clickable = l.state !== "soon";
  const isNext = l.state === "next" && !locked;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="me-2 text-xs font-semibold text-slate-400 tabular-nums">{l.number}</span>
        <span className={cn("font-medium", l.state === "soon" && "text-slate-400", l.state === "done" && "text-slate-600 dark:text-slate-400")}>
          {l.title}
        </span>
        {isNext && (
          <span className="ms-2 inline-block whitespace-nowrap rounded-full bg-spark-400 px-2 py-0.5 text-[11px] font-bold text-slate-900">הבא בתור</span>
        )}
      </span>
      {l.state === "soon" ? (
        <Badge>בקרוב</Badge>
      ) : (
        l.minutes !== null && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              l.state === "done"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {l.minutes} דק׳
          </span>
        )
      )}
    </>
  );
  const rowClass = cn(
    "flex flex-1 items-center gap-3 rounded-xl px-4 py-3 ring-1 transition",
    isNext
      ? "bg-spark-300/10 ring-spark-400 dark:bg-spark-400/10"
      : "bg-slate-50 ring-transparent dark:bg-slate-800/50",
    clickable && !isNext && "hover:bg-brand-50 hover:ring-brand-200 dark:hover:bg-brand-950/40 dark:hover:ring-brand-900",
  );
  return (
    <li className="relative flex items-center gap-3">
      <StatusNode state={l.state} locked={locked} />
      {clickable ? (
        <Link href={l.href} className={rowClass} aria-label={`${l.number} ${l.title}${l.state === "done" ? " (הושלם)" : ""}`}>
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}

function StatusNode({ state, locked }: { state: LessonState; locked: boolean }) {
  const base = "relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-slate-900";
  if (state === "done")
    return (
      <span aria-hidden className={cn(base, "bg-emerald-500 text-white")}>
        <CheckIcon className="size-4" />
      </span>
    );
  if (locked && state !== "soon")
    return (
      <span aria-hidden className={cn(base, "bg-slate-100 text-sm dark:bg-slate-800")}>
        🔒
      </span>
    );
  if (state === "next")
    return (
      <span aria-hidden className={cn(base, "bg-brand-600 text-white")}>
        <span className="absolute inset-0 rounded-full bg-brand-500/50 motion-safe:animate-ping" />
        <PlayIcon className="relative size-3.5" />
      </span>
    );
  if (state === "open")
    return (
      <span aria-hidden className={cn(base, "bg-white dark:bg-slate-900")}>
        <span className="size-3 rounded-full border-2 border-brand-400" />
      </span>
    );
  return (
    <span aria-hidden className={cn(base, "bg-slate-50 dark:bg-slate-900")}>
      <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-700" />
    </span>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="אחוז השלמה">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700", pct === 100 ? "stroke-emerald-500" : "stroke-spark-400")}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-extrabold tabular-nums">{pct}%</span>
    </div>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{children}</li>;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק׳`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ש׳ ${m} דק׳` : `${h} ש׳`;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

/** Media controls aren't mirrored in RTL. */
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M4 2.5v11a.5.5 0 00.77.42l8.5-5.5a.5.5 0 000-.84l-8.5-5.5A.5.5 0 004 2.5z" />
    </svg>
  );
}
