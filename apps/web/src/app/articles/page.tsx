import Link from "next/link";
import type { Metadata } from "next";
import { Badge, buttonClass, Card, IconRss, SectionHeading } from "@electricademy/ui";
import { ARTICLE_CATEGORIES, listArticles } from "@electricademy/content";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = { title: "מאמרים וחדשות" };

export default function ArticlesPage() {
  const articles = listArticles();
  return (
    <>
      <SectionHeading
        as="h1"
        title="מאמרים וחדשות"
        subtitle="מערכות הספק, תקנות, מתקנים וחידושים בעולם החשמל."
        action={
          <a href="/articles/rss.xml" className={buttonClass("secondary", undefined, "sm")}>
            <IconRss className="size-4 text-orange-500" />
            הרשמה ב־RSS
          </a>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <Link key={a.slug} href={`/articles/${a.slug}`} className="group rounded-(--radius-card) outline-none">
            <Card interactive className="flex h-full flex-col">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Badge tone="brand">{ARTICLE_CATEGORIES[a.category] ?? a.category}</Badge>
                {formatDate(a.date)}
              </div>
              <h2 className="mt-3 text-xl leading-snug font-extrabold group-hover:text-brand-700 dark:group-hover:text-brand-300">{a.title}</h2>
              <p className="mt-2 flex-1 text-slate-600 dark:text-slate-400">{a.summary}</p>
              <p className="mt-4 text-sm font-bold text-brand-700 dark:text-brand-300">להמשך קריאה</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
