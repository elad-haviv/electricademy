import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { can } from "@electricademy/auth";
import { getLesson, getModule, lessonPath } from "@electricademy/content";
import { getDb, lessonProgress } from "@electricademy/db";
import { buttonClass } from "@electricademy/ui";
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

  const idx = module.lessons.findIndex((l) => l.slug === ref.slug);
  const next = module.lessons[idx + 1];

  let completed = false;
  if (user) {
    const [row] = await getDb()
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonPath, path)))
      .limit(1);
    completed = Boolean(row);
  }

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="פירורי לחם" className="text-sm text-slate-500 dark:text-slate-400">
        <Link href={`/tracks/${track.slug}`} className="text-brand-700 dark:text-brand-300">
          {track.title}
        </Link>{" "}
        / {module.title}
      </nav>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{lesson?.frontmatter.title ?? ref.title}</h1>
      {lesson && (
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {lesson.frontmatter.summary} · {lesson.frontmatter.minutes} דק׳ קריאה
        </p>
      )}

      <div className="mt-8">
        {!allowed ? (
          <Paywall loggedIn={Boolean(user)} />
        ) : !lesson ? (
          <p className="rounded-xl bg-slate-100 p-6 text-center dark:bg-slate-900">השיעור בהכנה. בקרוב!</p>
        ) : (
          <>
            <Mdx source={lesson.body} />
            <ProductBanner slugs={lesson.frontmatter.promote ?? []} />
          </>
        )}
      </div>

      {allowed && lesson && (
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          {user ? (
            <LessonCompleteButton lessonPath={path} completed={completed} />
          ) : (
            <Link href={`/login?callbackUrl=/tracks/${path}`} className={buttonClass("secondary")}>
              התחברו כדי לשמור התקדמות
            </Link>
          )}
          <div className="flex gap-2">
            <Link href={`/community/new?lesson=${encodeURIComponent(path)}`} className={buttonClass("ghost")}>
              💬 שאלה על השיעור
            </Link>
            {next && (
              <Link href={`/tracks/${track.slug}/${module.slug}/${next.slug}`} className={buttonClass("primary")}>
                הבא: {next.title} ←
              </Link>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}
