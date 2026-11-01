import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { can } from "@electricademy/auth";
import { getLesson, getModule, hasLesson, lessonPath } from "@electricademy/content";
import { getDb, lessonProgress } from "@electricademy/db";
import {
  Badge,
  buttonClass,
  cn,
  IconArrowLeft,
  IconArrowRight,
  IconChat,
  IconCheckCircle,
  IconCircle,
  IconClock,
  ProgressBar,
} from "@electricademy/ui";
import { Crumbs } from "@/components/Crumbs";
import { Mdx } from "@/components/Mdx";
import { Paywall } from "@/components/Paywall";
import { ProductBanner } from "@/components/ProductBanner";
import { LessonCompleteButton } from "@/components/forms";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

type Params = Promise<{ track: string; module: string; lesson: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const lesson = getLesson(p.track, p.module, p.lesson);
  return { title: lesson?.frontmatter.title, description: lesson?.frontmatter.summary };
}

export default async function LessonPage({ params }: { params: Params }) {
  const p = await params;
  const found = getModule(p.track, p.module);
  const ref = found?.module.lessons.find((l) => l.slug === p.lesson);
  if (!found || !ref) notFound();
  const { track, module } = found;

  const [user, access] = await Promise.all([getSessionUser(), getCurrentAccess()]);
  const allowed = can(access, track.tier === "pro" ? "lessons.advanced" : "lessons.basic");
  const lesson = getLesson(track.slug, module.slug, ref.slug);
  const path = lessonPath(track.slug, module.slug, ref.slug);

  // Every lesson in the track, in order, so prev/next can cross module boundaries.
  const sequence = track.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      title: l.title,
      moduleTitle: m.title,
      href: `/tracks/${track.slug}/${m.slug}/${l.slug}`,
      ready: hasLesson(track.slug, m.slug, l.slug),
    })),
  );
  const here = sequence.findIndex((s) => s.href === `/tracks/${track.slug}/${module.slug}/${ref.slug}`);
  const prev = sequence.slice(0, here).reverse().find((s) => s.ready);
  const next = sequence.slice(here + 1).find((s) => s.ready);

  const done = new Set<string>();
  if (user) {
    const rows = await getDb()
      .select({ path: lessonProgress.lessonPath })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, user.id));
    for (const r of rows) done.add(r.path);
  }
  const completed = done.has(path);

  const idxInModule = module.lessons.findIndex((l) => l.slug === ref.slug);
  const moduleNumber = track.modules.findIndex((m) => m.slug === module.slug) + 1;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
      <article className="min-w-0">
        <Crumbs
          items={[
            { label: "מסלולים", href: "/tracks" },
            { label: track.title, href: `/tracks/${track.slug}` },
            { label: module.title, href: `/tracks/${track.slug}#${module.slug}` },
          ]}
        />

        <header className="max-w-[70ch]">
          <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
            מודול {moduleNumber} · שיעור {idxInModule + 1} מתוך {module.lessons.length}
          </p>
          <h1 className="mt-1 text-3xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {lesson?.frontmatter.title ?? ref.title}
          </h1>
          {lesson && (
            <>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{lesson.frontmatter.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge>
                  <IconClock className="size-3.5" />
                  {lesson.frontmatter.minutes} דק׳ קריאה
                </Badge>
                {completed && (
                  <Badge tone="success">
                    <IconCheckCircle className="size-3.5" />
                    הושלם
                  </Badge>
                )}
              </div>
            </>
          )}
          <ProgressBar
            className="mt-5 lg:hidden"
            value={((idxInModule + 1) / module.lessons.length) * 100}
            label={`שיעור ${idxInModule + 1} מתוך ${module.lessons.length} במודול`}
          />
        </header>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
          {!allowed ? (
            <Paywall loggedIn={Boolean(user)} />
          ) : !lesson ? (
            <p className="rounded-2xl bg-slate-100 p-8 text-center text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              השיעור בהכנה. בקרוב!
            </p>
          ) : (
            <>
              <Mdx source={lesson.body} />
              <ProductBanner slugs={lesson.frontmatter.promote ?? []} />
            </>
          )}
        </div>

        {allowed && lesson && (
          <footer className="mt-12 max-w-[70ch] space-y-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900 dark:ring-slate-800">
              <div>
                <p className="font-bold">{completed ? "סיימתם את השיעור. יפה!" : "סיימתם לקרוא?"}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user ? "סמנו כדי לעקוב אחרי ההתקדמות שלכם במסלול." : "התחברו כדי לשמור את ההתקדמות שלכם."}
                </p>
              </div>
              {user ? (
                <LessonCompleteButton lessonPath={path} completed={completed} />
              ) : (
                <Link href={`/login?callbackUrl=/tracks/${path}`} className={buttonClass("secondary")}>
                  התחברות
                </Link>
              )}
            </div>

            <nav aria-label="ניווט בין שיעורים" className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <PagerLink href={prev.href} direction="prev" title={prev.title} meta={prev.moduleTitle} />
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && <PagerLink href={next.href} direction="next" title={next.title} meta={next.moduleTitle} />}
            </nav>

            <Link
              href={`/community/new?lesson=${encodeURIComponent(path)}`}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <IconChat className="size-5 shrink-0 text-brand-600" />
              <span>
                <span className="block font-bold">משהו לא ברור?</span>
                <span className="text-sm">שאלו את הקהילה על השיעור הזה</span>
              </span>
            </Link>
          </footer>
        )}
      </article>

      <aside className="hidden lg:block" aria-label="שיעורים במודול">
        <div className="sticky top-24 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">מודול {moduleNumber}</p>
          <p className="font-bold">{module.title}</p>
          <ProgressBar
            className="mt-3"
            value={(module.lessons.filter((l) => done.has(lessonPath(track.slug, module.slug, l.slug))).length / module.lessons.length) * 100}
            label="התקדמות במודול"
          />
          <ol className="mt-4 space-y-0.5">
            {module.lessons.map((l, i) => {
              const current = l.slug === ref.slug;
              const ready = hasLesson(track.slug, module.slug, l.slug);
              const isDone = done.has(lessonPath(track.slug, module.slug, l.slug));
              const inner = (
                <>
                  {isDone ? (
                    <IconCheckCircle className="size-4.5 shrink-0 text-emerald-600" title="הושלם" />
                  ) : (
                    <span className={cn("flex size-4.5 shrink-0 items-center justify-center", current ? "text-brand-600" : "text-slate-400")}>
                      {current ? <IconCircle className="size-4.5 fill-current" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </span>
                  )}
                  <span className="flex-1">{l.title}</span>
                  {!ready && <span className="text-xs">בקרוב</span>}
                </>
              );
              const cls = cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                current && "bg-brand-50 font-bold text-brand-800 dark:bg-brand-950/60 dark:text-brand-200",
                !current && ready && "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                !ready && "text-slate-500 dark:text-slate-500",
              );
              return (
                <li key={l.slug}>
                  {ready && !current ? (
                    <Link href={`/tracks/${track.slug}/${module.slug}/${l.slug}`} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <span className={cls} aria-current={current ? "page" : undefined}>
                      {inner}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <Link href={`/tracks/${track.slug}`} className="mt-4 block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            לכל המסלול
          </Link>
        </div>
      </aside>
    </div>
  );
}

function PagerLink({ href, direction, title, meta }: { href: string; direction: "prev" | "next"; title: string; meta: string }) {
  const Arrow = direction === "next" ? IconArrowLeft : IconArrowRight;
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl p-4 ring-1 transition",
        direction === "next"
          ? "bg-brand-600 text-white ring-brand-600 hover:bg-brand-700 sm:col-start-2"
          : "bg-white ring-slate-200 hover:ring-brand-300 dark:bg-slate-900 dark:ring-slate-800",
      )}
    >
      {direction === "prev" && <Arrow className="size-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />}
      <span className={cn("flex-1", direction === "next" && "text-start")}>
        <span className={cn("block text-xs font-semibold", direction === "next" ? "text-brand-100" : "text-slate-500 dark:text-slate-400")}>
          {direction === "next" ? "השיעור הבא" : "השיעור הקודם"} · {meta}
        </span>
        <span className="block font-bold">{title}</span>
      </span>
      {direction === "next" && <Arrow className="size-5 shrink-0 transition group-hover:-translate-x-0.5" />}
    </Link>
  );
}
