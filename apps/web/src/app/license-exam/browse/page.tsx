import Link from "next/link";
import type { Metadata } from "next";
import { buttonClass, cn } from "@electricademy/ui";
import {
  EXAM_LEVELS,
  EXAM_TOPICS,
  isExamLevel,
  loadExamBank,
  questionsForLevel,
  questionText,
  searchKey,
  type ExamTopic,
} from "@electricademy/content";
import { BankQuestionCard } from "@/components/license-exam/BankQuestionCard";
import { getCommentCounts } from "@/lib/examDiscussion";
import { requireExamUser, toClient } from "@/lib/licenseExam";

export const metadata: Metadata = {
  title: "מאגר שאלות לבחינות רישוי בחשמל",
  description: "עיון וחיפוש בכל שאלות המאגר הרשמי לבחינות הרישוי בחשמל (טכנאים, הנדסאים ומהנדסים), לפי נושא ורישיון.",
};

// Comment counts come from the database.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Params = { level?: string; topic?: string; q?: string; page?: string };

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  await requireExamUser(`/license-exam/browse?${new URLSearchParams(params as Record<string, string>)}`);
  const bank = loadExamBank();
  const level = isExamLevel(params.level) ? params.level : undefined;
  const topic = params.topic && params.topic in EXAM_TOPICS ? (params.topic as ExamTopic) : undefined;
  const query = (params.q ?? "").trim().slice(0, 100);

  let rows = level ? questionsForLevel(bank, level) : bank.questions;
  if (topic) rows = rows.filter((q) => q.topic === topic);
  if (query) {
    if (/^\d+$/.test(query)) rows = rows.filter((q) => String(q.n) === query || q.serial === query);
    else {
      const words = searchKey(query).split(" ");
      rows = rows.filter((q) => {
        const hay = searchKey(questionText(q));
        return words.every((w) => hay.includes(w));
      });
    }
  }
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(params.page) || 1, 1), pages);
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((q) => toClient(q, true));
  const comments = await getCommentCounts(shown.map((q) => q.n));

  const href = (p: Partial<Params>) => {
    const sp = new URLSearchParams();
    const merged = { level, topic, q: query || undefined, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
    const s = sp.toString();
    return `/license-exam/browse${s ? `?${s}` : ""}`;
  };

  const field = "w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700";
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/license-exam">סימולטור בחינות רישוי</Link> / עיון במאגר
      </nav>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">עיון במאגר השאלות</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {bank.meta.count.toLocaleString("he-IL")} שאלות, גרסה {bank.meta.version} של המאגר הרשמי.
        </p>
      </div>

      <form action="/license-exam/browse" className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-[2fr_1fr_1fr_auto] dark:bg-slate-900 dark:ring-slate-800">
        <label>
          <span className="sr-only">חיפוש</span>
          <input name="q" defaultValue={query} placeholder="חיפוש: מילים, מספר שאלה או קוד" className={field} type="search" />
        </label>
        <label>
          <span className="sr-only">רישיון</span>
          <select name="level" defaultValue={level ?? ""} className={field}>
            <option value="">כל הרישיונות</option>
            {Object.entries(EXAM_LEVELS).map(([id, l]) => (
              <option key={id} value={id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">נושא</span>
          <select name="topic" defaultValue={topic ?? ""} className={field}>
            <option value="">כל הנושאים</option>
            {Object.entries(EXAM_TOPICS).map(([id, t]) => (
              <option key={id} value={id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <button className={buttonClass("primary")}>סינון</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          {rows.length.toLocaleString("he-IL")} שאלות{rows.length > PAGE_SIZE && ` · עמוד ${page} מתוך ${pages}`}
        </p>
        {rows.length > 0 && topic && (
          <Link href={`/license-exam/practice?topic=${topic}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            לתרגל את הנושא הזה ←
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {shown.map((q) => (
          <BankQuestionCard key={q.n} q={q} comments={comments[q.n]} />
        ))}
        {shown.length === 0 && <p className="text-slate-600 dark:text-slate-400">לא נמצאו שאלות. נסו חיפוש אחר.</p>}
      </div>

      {pages > 1 && (
        <nav aria-label="עמודים" className="flex flex-wrap items-center justify-center gap-1">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })} className={buttonClass("secondary")}>
              → הקודם
            </Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - arr[i - 1]! > 1 && <span aria-hidden>…</span>}
                <Link
                  href={href({ page: String(p) })}
                  aria-current={p === page ? "page" : undefined}
                  className={cn("grid size-9 place-items-center rounded-lg text-sm tabular-nums ring-1", p === page ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 dark:ring-slate-700")}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < pages && (
            <Link href={href({ page: String(page + 1) })} className={buttonClass("secondary")}>
              הבא ←
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
