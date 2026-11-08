import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Badge, buttonClass, Card } from "@electricademy/ui";
import { getDb, posts, threads, users } from "@electricademy/db";
import { ReplyForm } from "@/components/forms";
import { COMMUNITY_TAGS, formatDate } from "@/lib/labels";
import { getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

/** Each thread gets its own page title (WCAG 2.4.2). */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return {};
  const [row] = await getDb()
    .select({ title: threads.title })
    .from(threads)
    .where(eq(threads.id, id))
    .limit(1)
    .catch(() => []);
  return row ? { title: `${row.title} · קהילה` } : {};
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = getDb();
  const [thread] = await db
    .select({ thread: threads, author: users.name })
    .from(threads)
    .innerJoin(users, eq(users.id, threads.authorId))
    .where(eq(threads.id, id))
    .limit(1);
  if (!thread) notFound();

  const [replies, user] = await Promise.all([
    db
      .select({ post: posts, author: users.name })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.threadId, id))
      .orderBy(asc(posts.createdAt)),
    getSessionUser(),
  ]);

  const t = thread.thread;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/community" className="text-sm text-brand-700 dark:text-brand-300">
        → חזרה לקהילה
      </Link>
      <Card>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Badge>{COMMUNITY_TAGS[t.tag] ?? t.tag}</Badge>
          {thread.author ?? "משתמש"} · {formatDate(t.createdAt)}
          {t.lessonPath && (
            <Link href={`/tracks/${t.lessonPath}`} className="text-brand-700 dark:text-brand-300">
              📚 לשיעור
            </Link>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">{t.title}</h1>
        <p className="mt-4 leading-8 whitespace-pre-wrap">{t.body}</p>
      </Card>

      <h2 className="text-lg font-bold">{replies.length} תגובות</h2>
      <ul className="space-y-3">
        {replies.map(({ post, author }) => (
          <li key={post.id}>
            <Card>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {author ?? "משתמש"} · {formatDate(post.createdAt)}
              </p>
              <p className="mt-2 leading-7 whitespace-pre-wrap">{post.body}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        {user ? (
          <ReplyForm threadId={id} />
        ) : (
          <Link href={`/login?callbackUrl=/community/${id}`} className={buttonClass("secondary")}>
            התחברו כדי להגיב
          </Link>
        )}
      </Card>
    </div>
  );
}
