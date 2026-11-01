import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Avatar, Badge, buttonClass, Card, IconBook } from "@electricademy/ui";
import { Crumbs } from "@/components/Crumbs";
import { getDb, posts, threads, users } from "@electricademy/db";
import { ReplyForm } from "@/components/forms";
import { COMMUNITY_TAGS, formatDate } from "@/lib/labels";
import { getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

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
      <Crumbs items={[{ label: "קהילה", href: "/community" }, { label: COMMUNITY_TAGS[t.tag] ?? t.tag, href: `/community?tag=${t.tag}` }]} />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{COMMUNITY_TAGS[t.tag] ?? t.tag}</Badge>
          {t.lessonPath && (
            <Link href={`/tracks/${t.lessonPath}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
              <IconBook className="size-4" />
              לשיעור הקשור
            </Link>
          )}
        </div>
        <h1 className="mt-3 text-2xl leading-snug font-extrabold sm:text-3xl">{t.title}</h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <Avatar name={thread.author} />
          <span>
            <span className="block font-semibold text-slate-900 dark:text-white">{thread.author ?? "משתמש"}</span>
            {formatDate(t.createdAt)}
          </span>
        </div>
        <p className="mt-5 text-lg leading-8 whitespace-pre-wrap">{t.body}</p>
      </Card>

      <h2 className="pt-2 text-xl font-extrabold">{replies.length === 0 ? "אין עדיין תגובות" : `${replies.length} תגובות`}</h2>
      <ul className="space-y-3">
        {replies.map(({ post, author }) => (
          <li key={post.id}>
            <Card className="flex gap-3">
              <Avatar name={author} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">{author ?? "משתמש"}</span> · {formatDate(post.createdAt)}
                </p>
                <p className="mt-1.5 leading-7 whitespace-pre-wrap">{post.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="mb-3 font-bold">{user ? "הוסיפו תגובה" : "רוצים להגיב?"}</h2>
        {user ? (
          <ReplyForm threadId={id} />
        ) : (
          <Link href={`/login?callbackUrl=/community/${id}`} className={buttonClass("secondary")}>
            התחברות כדי להגיב
          </Link>
        )}
      </Card>
    </div>
  );
}
