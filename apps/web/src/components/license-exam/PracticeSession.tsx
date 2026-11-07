"use client";

import { useState, useTransition } from "react";
import { Button, Card, cn } from "@electricademy/ui";
import { EXAM_LEVELS, EXAM_TOPICS, type ExamLevel, type ExamTopic } from "@electricademy/content/license-exam";
import type { ClientQuestion } from "@/lib/licenseExam";
import { drawPractice } from "@/lib/licenseExamActions";
import { BookmarkButton } from "./BookmarkButton";
import { KeyNote, OptionList, QuestionMeta, QuestionStem, type OptionState } from "./Question";
import { useExamStorage } from "./storage";

const COUNTS = [10, 20, 50];

export function PracticeSession({
  topicCounts,
  initialTopic,
  initialSource,
}: {
  topicCounts: Record<ExamLevel, Record<ExamTopic, number>>;
  initialTopic?: ExamTopic;
  initialSource?: "topics" | "bookmarks";
}) {
  const store = useExamStorage();
  // defaults to the licence level the learner chose last time (stored in this browser)
  const [chosenLevel, setLevel] = useState<ExamLevel | null>(null);
  const level = chosenLevel ?? store.level ?? "technician";
  const [topics, setTopics] = useState<ExamTopic[]>(initialTopic ? [initialTopic] : []);
  const [count, setCount] = useState(20);
  const [source, setSource] = useState<"topics" | "bookmarks">(initialSource ?? "topics");
  const [questions, setQuestions] = useState<ClientQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available =
    source === "bookmarks"
      ? store.bookmarks.length
      : (topics.length ? topics : (Object.keys(EXAM_TOPICS) as ExamTopic[])).reduce((s, t) => s + topicCounts[level][t], 0);

  const start = () => {
    setError(null);
    store.setLevel(level);
    startTransition(async () => {
      try {
        const qs = await drawPractice(
          source === "bookmarks"
            ? { level, topics: [], count: store.bookmarks.length, numbers: store.bookmarks }
            : { level, topics, count },
        );
        if (qs.length === 0) {
          setError("אין שאלות שמתאימות לבחירה הזו.");
          return;
        }
        setQuestions(qs);
        setIndex(0);
        setPicks({});
      } catch {
        setError("לא הצלחנו לטעון שאלות. נסו שוב.");
      }
    });
  };

  if (!questions) {
    return (
      <Card className="space-y-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="מקור השאלות">
          {(
            [
              ["topics", "לפי נושא"],
              ["bookmarks", `השאלות ששמרתי (${store.bookmarks.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={source === id}
              onClick={() => setSource(id)}
              className={cn("rounded-full px-3 py-1 text-sm font-semibold ring-1", source === id ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 dark:ring-slate-700")}
            >
              {label}
            </button>
          ))}
        </div>

        {source === "topics" ? (
          <>
            <label className="block">
              <span className="mb-1 block font-bold">רישיון</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ExamLevel)}
                className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200 sm:w-64 dark:bg-slate-900 dark:ring-slate-700"
              >
                {(Object.keys(EXAM_LEVELS) as ExamLevel[]).map((l) => (
                  <option key={l} value={l}>
                    {EXAM_LEVELS[l].title}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="mb-2 font-bold">נושאים</legend>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">בלי בחירה: כל הנושאים. הסיווג אוטומטי, לפי מילות מפתח בשאלה.</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EXAM_TOPICS) as ExamTopic[])
                  .filter((t) => topicCounts[level][t] > 0)
                  .map((t) => {
                    const on = topics.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTopics((cur) => (on ? cur.filter((x) => x !== t) : [...cur, t]))}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                          on ? "bg-brand-600 font-semibold text-white ring-brand-600" : "ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800",
                        )}
                      >
                        {EXAM_TOPICS[t].title} <span className="tabular-nums opacity-75">{topicCounts[level][t]}</span>
                      </button>
                    );
                  })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 font-bold">כמה שאלות?</legend>
              <div className="flex gap-2">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={count === c}
                    onClick={() => setCount(c)}
                    className={cn("rounded-xl px-4 py-2 text-sm font-semibold ring-1", count === c ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 dark:ring-slate-700")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {store.bookmarks.length
              ? "כל השאלות ששמרתם לחזרה (בכפתור ☆), בסדר אקראי."
              : "עוד לא שמרתם שאלות. לחצו על ☆ ליד שאלה בעיון במאגר או בסיכום בחינה."}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={start} disabled={pending || available === 0}>
            {pending ? "טוענים…" : "התחלת תרגול"}
          </Button>
          <span className="text-sm text-slate-600 tabular-nums dark:text-slate-400">{available} שאלות זמינות</span>
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </Card>
    );
  }

  const q = questions[index];
  if (!q) {
    const answered = Object.keys(picks).length;
    const keyed = questions.filter((x) => x.key && picks[x.n]);
    const correct = keyed.filter((x) => picks[x.n] === x.key!.answer).length;
    return (
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">סיימתם את הסבב</h2>
        <p>
          עניתם על {answered} מתוך {questions.length} שאלות
          {keyed.length > 0 && `; ${correct} נכונות מתוך ${keyed.length} שיש להן מפתח`}.
        </p>
        <div className="flex gap-2">
          <Button onClick={start} disabled={pending}>
            סבב נוסף
          </Button>
          <Button variant="secondary" onClick={() => setQuestions(null)}>
            שינוי בחירה
          </Button>
        </div>
      </Card>
    );
  }

  const picked = picks[q.n] ?? null;
  const stateOf = (c: number): OptionState => {
    if (picked === null) return "idle";
    if (q.key) return c === q.key.answer ? "correct" : c === picked ? "wrong" : "dim";
    return c === picked ? "selected" : "dim";
  };

  return (
    <div className="space-y-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden>
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <QuestionMeta q={q} number={index + 1} />
          <BookmarkButton n={q.n} />
        </div>
        <QuestionStem q={q} />
        <OptionList q={q} stateOf={stateOf} onPick={(c) => setPicks((p) => ({ ...p, [q.n]: c }))} disabled={picked !== null} />
        {picked !== null && <KeyNote q={q} picked={picked} />}
        <div className="flex justify-between gap-2">
          <span className="self-center text-sm text-slate-600 tabular-nums dark:text-slate-400">
            {index + 1} / {questions.length}
          </span>
          <Button onClick={() => setIndex((i) => i + 1)} variant={picked === null ? "secondary" : "primary"}>
            {picked === null ? "דילוג ←" : index === questions.length - 1 ? "סיום" : "הבאה ←"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
