import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@electricademy/ui";
import { Crumbs } from "@/components/Crumbs";
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
      <Crumbs items={[{ label: "מאמרים", href: "/articles" }, { label: ARTICLE_CATEGORIES[meta.category] ?? meta.category }]} />
      <header className="max-w-[70ch] border-b border-slate-200 pb-8 dark:border-slate-800">
        <Badge tone="brand">{ARTICLE_CATEGORIES[meta.category] ?? meta.category}</Badge>
        <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{meta.title}</h1>
        <p className="mt-3 text-lg text-slate-600 sm:text-xl dark:text-slate-400">{meta.summary}</p>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">{meta.author}</span> · {formatDate(meta.date)}
        </p>
      </header>
      <div className="mt-8">
        <Mdx source={body} />
      </div>
      <Link href="/articles" className="mt-12 inline-block font-bold text-brand-700 hover:underline dark:text-brand-300">
        לכל המאמרים
      </Link>
    </article>
  );
}
