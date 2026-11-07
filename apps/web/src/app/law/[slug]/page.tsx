import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLegislationEntry, LEGISLATION, lawToc, OFFICIAL_REPOSITORY_URL, wikisourceUrl } from "@electricademy/content";
import { LawDocument } from "@/components/law/LawDocument";
import { getLawDoc } from "@/lib/law";

export function generateStaticParams() {
  return LEGISLATION.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLawDoc(slug);
  return doc ? { title: doc.title, description: getLegislationEntry(slug)?.summary } : {};
}

export default async function LawPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getLegislationEntry(slug);
  const doc = getLawDoc(slug);
  if (!entry || !doc) notFound();
  const toc = lawToc(doc);
  const index = LEGISLATION.findIndex((e) => e.slug === slug);
  const prev = LEGISLATION[index - 1];
  const next = LEGISLATION[index + 1];

  return (
    <div className="space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/law">→ חוק החשמל ותקנותיו</Link>
      </nav>
      <header className="space-y-3 border-b border-slate-200 pb-6 dark:border-slate-800">
        <h1 className="text-2xl leading-tight font-black tracking-tight sm:text-3xl">{doc.title}</h1>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">{entry.summary}</p>
        {doc.sources && (
          <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer font-semibold">פרסומים ותיקונים</summary>
            <p className="law-sources mt-2" dangerouslySetInnerHTML={{ __html: doc.sources }} />
          </details>
        )}
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          נוסח משולב לקריאה מתוך{" "}
          <a href={wikisourceUrl(entry.wikisourceTitle)} target="_blank" rel="noopener" className="underline">
            ספר החוקים הפתוח
          </a>{" "}
          (CC BY-SA 4.0). הנוסח המחייב הוא הנוסח הרשמי שפורסם ברשומות; ראו גם את{" "}
          <a href={OFFICIAL_REPOSITORY_URL} target="_blank" rel="noopener" className="underline">
            מאגר התקנות ב־gov.il
          </a>
          .
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <LawDocument doc={doc} />
        {toc.length > 3 && (
          <aside className="order-first lg:order-none">
            <details className="rounded-2xl border border-slate-200 bg-white p-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer text-sm font-black">תוכן עניינים ({toc.length})</summary>
              <Toc toc={toc} />
            </details>
            <nav aria-label="תוכן עניינים" className="hidden rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-black">תוכן עניינים</p>
              <Toc toc={toc} />
            </nav>
          </aside>
        )}
      </div>

      <nav aria-label="מסמכים נוספים" className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {prev ? (
          <Link href={`/law/${prev.slug}`} className="font-semibold text-brand-700 dark:text-brand-300">
            → {getLawDoc(prev.slug)?.title ?? prev.wikisourceTitle}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/law/${next.slug}`} className="font-semibold text-brand-700 dark:text-brand-300">
            {getLawDoc(next.slug)?.title ?? next.wikisourceTitle} ←
          </Link>
        )}
      </nav>
    </div>
  );
}

function Toc({ toc }: { toc: ReturnType<typeof lawToc> }) {
  return (
    <ol className="mt-3 space-y-1 text-sm">
      {toc.map((t) => (
        <li key={t.id} className={t.level === 2 ? "mt-3 font-bold" : t.level === 3 ? "ms-2 mt-1 font-semibold" : "ms-4"}>
          <a href={`#${t.id}`} className="block rounded px-1 py-0.5 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
            {t.label}
          </a>
        </li>
      ))}
    </ol>
  );
}
