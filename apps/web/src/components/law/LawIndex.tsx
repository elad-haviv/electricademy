"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";

export interface LawIndexGroup {
  id: string;
  title: string;
  description: string;
  items: { slug: string; title: string; year: string | null; summary: string }[];
}

/** Hebrew-insensitive-ish search: ignores geresh/gershayim and hyphen variants. */
const norm = (s: string) => s.replace(/[׳״'"־-]/g, "").replace(/\s+/g, " ").toLowerCase();

export function LawIndex({ groups }: { groups: LawIndexGroup[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => norm(`${i.title} ${i.summary}`).includes(needle)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, q]);
  const count = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-10">
      <label className="relative block max-w-xl">
        <span className="sr-only">חיפוש בחוק ובתקנות</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש לפי שם או נושא: הארקות, לוחות, גנרטור…"
          className="w-full rounded-xl border border-slate-300 bg-white py-3 ps-10 pe-4 text-sm shadow-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
      </label>
      {q && (
        <p className="text-sm text-slate-500" aria-live="polite">
          {count === 0 ? "לא נמצאו תקנות מתאימות." : `נמצאו ${count} מסמכים.`}
        </p>
      )}
      {filtered.map((g) => (
        <section key={g.id} aria-labelledby={`cat-${g.id}`}>
          <h2 id={`cat-${g.id}`} className="text-xl font-black">
            {g.title}
          </h2>
          <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">{g.description}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {g.items.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/law/${i.slug}`}
                  className="group flex h-full flex-col rounded-2xl border-2 border-slate-200/90 bg-white p-5 transition-all hover:border-slate-900 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-spark-400"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-bold leading-snug group-hover:text-amber-700 dark:group-hover:text-spark-300">{i.title}</span>
                    {i.year && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{i.year}</span>}
                  </span>
                  <span className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{i.summary}</span>
                  <span className="mt-3 flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-spark-300">
                    לקריאה
                    <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
