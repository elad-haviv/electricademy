"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TrackIcon } from "./EngineeringIcons";

export interface TrackCardData {
  slug: string;
  title: string;
  audience: string;
  description: string;
  image: string;
  tier: "free" | "pro";
  topics: string[];
  moduleCount: number;
  lessonCount: number;
}

type Filter = "all" | "free" | "pro";

export function TrackGrid({ tracks }: { tracks: TrackCardData[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? tracks : tracks.filter((t) => t.tier === filter);
  const counts = { all: tracks.length, free: tracks.filter((t) => t.tier === "free").length, pro: tracks.filter((t) => t.tier === "pro").length };
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: `כל המסלולים (${counts.all})` },
    { id: "free", label: `חינם (${counts.free})` },
    { id: "pro", label: `Pro (${counts.pro})` },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-3 inline-flex rounded-full border border-sky-200 bg-sky-100/90 px-3 py-1 text-xs font-extrabold text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
            מפת למידה אחת, מהיסודות ועד מתח גבוה
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">למי זה מתאים? בחרו מסלול</h2>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            מלימודי יסוד חינמיים ועד התמחות במערכות הספק. אפשר להתחיל בכל נקודה ולהתקדם הלאה.
          </p>
        </div>
        <div role="group" aria-label="סינון מסלולים" className="inline-flex self-start rounded-xl border border-slate-300/80 bg-slate-200/80 p-1.5 md:self-auto dark:border-slate-700 dark:bg-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-extrabold transition-all ${
                filter === tab.id
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => (
          <Link
            key={t.slug}
            href={`/tracks/${t.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:border-slate-900 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-spark-400"
          >
            <div className="relative">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0d1a4a]">
                <Image src={t.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <span className="absolute start-4 bottom-0 translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-md transition-colors group-hover:border-amber-400">
                <TrackIcon slug={t.slug} />
              </span>
              <span
                className={`absolute end-3 top-3 rounded-full border px-3 py-1 text-xs font-black tracking-wide ${
                  t.tier === "pro" ? "border-slate-800 bg-slate-900 text-amber-400" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {t.tier === "pro" ? "Pro" : "חינם"}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6 pt-9">
              <p className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">{t.audience}</p>
              <h3 className="text-xl font-black transition-colors group-hover:text-amber-700 dark:group-hover:text-spark-300">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t.description}</p>
              <ul className="mt-4 mb-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {t.topics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {topic}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs font-bold dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">
                  {t.moduleCount === 1 ? "פרק אחד" : `${t.moduleCount} פרקים`} ·{" "}
                  <span className="text-sky-700 dark:text-sky-400">{t.lessonCount === 1 ? "שיעור אחד" : `${t.lessonCount} שיעורים`}</span>
                </span>
                <span className="flex items-center gap-1 font-extrabold group-hover:text-amber-700 dark:group-hover:text-spark-300">
                  לסילבוס
                  <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
