import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Badge, buttonClass, Card, cn } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { getDb, posts, threads, users } from "@electricademy/db";
import { COMMUNITY_TAGS, formatDate } from "@/lib/labels";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "קהילה" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const activeTag = tag && tag in COMMUNITY_TAGS ? tag : undefined;
  const db = getDb();
  const rows = await db
    .select({
      id: threads.id,
      title: threads.title,
      tag: threads.tag,
      createdAt: threads.createdAt,
      author: users.name,
      replies: sql<number>`(select count(*)::int from ${posts} where ${posts.threadId} = ${threads.id})`,
    })
    .from(threads)
    .innerJoin(users, eq(users.id, threads.authorId))
    .where(activeTag ? eq(threads.tag, activeTag) : undefined)
    .orderBy(desc(threads.createdAt))
    .limit(50);

  return (
    <>
      <PageBanner
        title="קהילה"
        subtitle="שואלים, עונים ולומדים יחד, מתלמידי בגרות ועד מהנדסי מערכות הספק."
        image="/images/community.webp"
      >
        <Link href="/community/new" className={buttonClass("primary", "mt-3 self-start bg-spark-400 text-slate-900 hover:bg-spark-300")}>
          + דיון חדש
        </Link>
      </PageBanner>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link href="/community" className={cn(buttonClass(activeTag ? "ghost" : "secondary"), "shrink-0")}>
          הכל
        </Link>
        {Object.entries(COMMUNITY_TAGS).map(([value, label]) => (
          <Link key={value} href={`/community?tag=${value}`} className={cn(buttonClass(activeTag === value ? "secondary" : "ghost"), "shrink-0")}>
            {label}
          </Link>
        ))}
      </div>
      <Card className="p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/community/${t.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex-1">
                  <p className="font-semibold">{t.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Badge>{COMMUNITY_TAGS[t.tag] ?? t.tag}</Badge>
                    {t.author ?? "משתמש"} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <span className="text-sm text-slate-500">💬 {t.replies}</span>
              </Link>
            </li>
          ))}
          {rows.length === 0 && <li className="p-8 text-center text-slate-500">אין עדיין דיונים בנושא הזה. פתחו את הראשון!</li>}
        </ul>
      </Card>
    </>
  );
}
