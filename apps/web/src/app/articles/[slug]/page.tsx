import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@electricademy/ui";
import { ARTICLE_CATEGORIES, getArticle, listArticles } from "@electricademy/content";
import { Mdx } from "@/components/Mdx";
import { formatDate } from "@/lib/labels";

export function generateStaticParams() {
  return listArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return { title: article?.meta.title, description: article?.meta.summary };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const { meta, body } = article;
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/articles" className="text-sm text-brand-700 dark:text-brand-300">
        → כל המאמרים
      </Link>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Badge tone="brand">{ARTICLE_CATEGORIES[meta.category] ?? meta.category}</Badge>
        {formatDate(meta.date)} · {meta.author}
      </div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{meta.title}</h1>
      <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{meta.summary}</p>
      <div className="mt-8">
        <Mdx source={body} />
      </div>
    </article>
  );
}
