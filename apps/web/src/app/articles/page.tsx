import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, SectionHeading } from "@electricademy/ui";
import { ARTICLE_CATEGORIES, listArticles } from "@electricademy/content";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = { title: "מאמרים וחדשות" };

export default function ArticlesPage() {
  const articles = listArticles();
  return (
    <>
      <SectionHeading
        level={1}
        title="מאמרים וחדשות"
        subtitle="מערכות הספק, תקנות, מתקנים וחידושים בעולם החשמל."
        action={
          <a href="/articles/rss.xml" className="text-sm text-brand-700 dark:text-brand-300">
            RSS
          </a>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <Link key={a.slug} href={`/articles/${a.slug}`}>
            <Card className="h-full transition hover:ring-brand-400">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Badge tone="brand">{ARTICLE_CATEGORIES[a.category] ?? a.category}</Badge>
                {formatDate(a.date)}
              </div>
              <h2 className="mt-2 text-lg font-bold">{a.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
