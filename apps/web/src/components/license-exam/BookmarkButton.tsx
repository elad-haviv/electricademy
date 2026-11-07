"use client";

import { cn } from "@electricademy/ui";
import { useExamStorage } from "./storage";

export function BookmarkButton({ n, className }: { n: number; className?: string }) {
  const { bookmarks, toggleBookmark } = useExamStorage();
  const on = bookmarks.includes(n);
  return (
    <button
      type="button"
      onClick={() => toggleBookmark(n)}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1 transition",
        on
          ? "bg-spark-300 text-slate-900 ring-spark-400"
          : "text-slate-600 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800",
        className,
      )}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? "שמורה לחזרה" : "שמירה לחזרה"}
    </button>
  );
}
