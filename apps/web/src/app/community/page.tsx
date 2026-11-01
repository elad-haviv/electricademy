import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Avatar, Badge, buttonClass, Card, cn, IconChat, IconChevronLeft, IconPlus } from "@electricademy/ui";
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
        <Link href="/community/new" className={buttonClass("spark", "mt-3 self-start", "lg")}>
          <IconPlus className="size-5" />
          שאלה או דיון חדש
        </Link>
      </PageBanner>
      <nav aria-label="סינון לפי נושא" className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <ul className="flex gap-2">
          {[["", "הכל"] as const, ...Object.entries(COMMUNITY_TAGS)].map(([value, label]) => {
            const active = (activeTag ?? "") === value;
            return (
              <li key={value} className="shrink-0">
                <Link
                  href={value ? `/community?tag=${value}` : "/community"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ring-1 transition",
                    active
                      ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white"
                      : "bg-white text-slate-700 ring-slate-300 hover:ring-slate-400 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Card className="overflow-hidden p-0 sm:p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/community/${t.id}`} className="group flex items-center gap-3 p-4 transition hover:bg-slate-50 sm:gap-4 sm:px-6 dark:hover:bg-slate-800/50">
                <span className="hidden sm:block">
                  <Avatar name={t.author} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{t.title}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <Badge>{COMMUNITY_TAGS[t.tag] ?? t.tag}</Badge>
                    <span>
                      {t.author ?? "משתמש"} · {formatDate(t.createdAt)}
                    </span>
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-600 tabular-nums dark:text-slate-400" aria-label={`${t.replies} תגובות`}>
                  <IconChat className="size-4" />
                  {t.replies}
                </span>
                <IconChevronLeft className="size-5 shrink-0 text-slate-400" />
              </Link>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="flex flex-col items-center gap-3 p-10 text-center text-slate-600 dark:text-slate-400">
              <IconChat className="size-8 text-slate-400" />
              אין עדיין דיונים בנושא הזה.
              <Link href="/community/new" className={buttonClass("primary")}>
                פתחו את הדיון הראשון
              </Link>
            </li>
          )}
        </ul>
      </Card>
    </>
  );
}
