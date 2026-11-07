import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";

const KEY_DOCS = [
  { slug: "electricity-law", label: "חוק החשמל" },
  { slug: "earthing-and-shock-protection", label: "הארקות והגנה בפני חישמול" },
  { slug: "conductor-loading-and-protection", label: "העמסה והגנה על מוליכים" },
  { slug: "switchboards", label: "התקנת לוחות" },
  { slug: "licenses", label: "רישיונות" },
];

/** Points learners at the full legislation from licensing-related pages. */
export function LawCallout({ title = "חוק החשמל ותקנותיו, בנוסח מלא" }: { title?: string }) {
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border-2 border-slate-900 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-spark-300 dark:bg-slate-800">
        <BookOpen className="size-6" aria-hidden />
      </span>
      <div className="flex-1">
        <h2 className="font-black">{title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          החוק ו־22 תקנות, עם תוכן עניינים וקישור ישיר לכל תקנה:{" "}
          {KEY_DOCS.map((d, i) => (
            <span key={d.slug}>
              <Link href={`/law/${d.slug}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300">
                {d.label}
              </Link>
              {i < KEY_DOCS.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      </div>
      <Link href="/law" className="flex items-center gap-1 self-start rounded-xl bg-spark-400 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-spark-300 sm:self-center">
        לכל התקנות
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
    </aside>
  );
}
