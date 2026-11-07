"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge, Button, buttonClass, Card, cn } from "@electricademy/ui";
import { EXAM_LEVELS, EXAM_TOPICS, type ExamLevel, type ExamTopic } from "@electricademy/content/license-exam";
import type { ClientQuestion } from "@/lib/licenseExam";
import { drawExam, gradeExam, type ExamGrade } from "@/lib/licenseExamActions";
import { BookmarkButton } from "./BookmarkButton";
import { DiscussionLink, KeyNote, OptionList, QuestionMeta, QuestionStem, type OptionState } from "./Question";
import { useExamStorage } from "./storage";

const TIME_LIMITS = [
  { minutes: 0, label: "ללא הגבלת זמן" },
  { minutes: 60, label: "שעה" },
  { minutes: 90, label: "שעה וחצי" },
  { minutes: 120, label: "שעתיים" },
  { minutes: 180, label: "שלוש שעות" },
];

type Phase =
  | { name: "setup" }
  | { name: "running" }
  | { name: "done"; grade: ExamGrade; seconds: number };

type ReviewFilter = "all" | "flagged" | "unanswered" | "wrong" | "right" | "unkeyed";

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ""}${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export function ExamSimulator({ poolSizes, examSize, bankVersion }: { poolSizes: Record<ExamLevel, number>; examSize: number; bankVersion: string | null }) {
  const store = useExamStorage();
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  // defaults to the licence level the learner chose last time (stored in this browser)
  const [chosenLevel, setLevel] = useState<ExamLevel | null>(null);
  const level = chosenLevel ?? store.level ?? "technician";
  const [minutes, setMinutes] = useState(0);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const start = () => {
    setError(null);
    store.setLevel(level);
    startTransition(async () => {
      try {
        const qs = await drawExam(level);
        setQuestions(qs);
        setAnswers({});
        setFlags(new Set());
        setCurrent(0);
        setStartedAt(Date.now());
        setNow(Date.now());
        submitted.current = false;
        setPhase({ name: "running" });
      } catch {
        setError("לא הצלחנו להכין בחינה. נסו שוב.");
      }
    });
  };

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const remaining = minutes ? Math.max(0, minutes * 60 - elapsed) : null;

  const submitted = useRef(false);
  const submit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    setConfirming(false);
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    startTransition(async () => {
      try {
        const grade = await gradeExam({
          level,
          answers: Object.fromEntries(Object.entries(answers).map(([n, c]) => [n, c])),
          numbers: questions.map((q) => q.n),
        });
        store.addHistory({
          at: new Date().toISOString(),
          level,
          total: questions.length,
          answered: Object.keys(answers).length,
          keyed: grade.keyed,
          correct: grade.correct,
          seconds,
        });
        setPhase({ name: "done", grade, seconds });
        window.scrollTo({ top: 0 });
      } catch {
        submitted.current = false;
        setError("ההגשה נכשלה. בדקו את החיבור ונסו שוב; התשובות נשמרו בדף.");
      }
    });
  }, [answers, level, questions, startedAt, store]);

  // clock, and auto-submit when time runs out
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    if (phase.name !== "running") return;
    const deadline = minutes ? startedAt + minutes * 60_000 : null;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (deadline && t >= deadline) submitRef.current();
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase.name, minutes, startedAt]);

  // leaving mid-exam loses it
  useEffect(() => {
    if (phase.name !== "running") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase.name]);

  const go = useCallback(
    (i: number) => {
      setCurrent(Math.min(Math.max(i, 0), questions.length - 1));
      topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [questions.length],
  );

  // keyboard: 1-4 answer, ← next, → previous (right-to-left page)
  useEffect(() => {
    if (phase.name !== "running" || confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const q = questions[current];
      if (!q) return;
      if (/^[1-4]$/.test(e.key)) setAnswers((a) => ({ ...a, [q.n]: Number(e.key) }));
      else if (e.key === "ArrowLeft") go(current + 1);
      else if (e.key === "ArrowRight") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase.name, confirming, questions, current, go]);

  if (phase.name === "setup") {
    return (
      <div className="space-y-6">
        <Card className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-bold">לאיזה רישיון אתם ניגשים?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(EXAM_LEVELS) as ExamLevel[]).map((l) => (
                <label
                  key={l}
                  className={cn(
                    "cursor-pointer rounded-xl p-4 ring-1 transition has-focus-visible:outline-2 has-focus-visible:outline-brand-500",
                    level === l ? "bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950/50" : "ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800",
                  )}
                >
                  <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="sr-only" />
                  <span className="block font-bold">{EXAM_LEVELS[l].title}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{poolSizes[l].toLocaleString("he-IL")} שאלות במאגר</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1 block font-bold">הגבלת זמן</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200 sm:w-64 dark:bg-slate-900 dark:ring-slate-700"
            >
              {TIME_LIMITS.map((t) => (
                <option key={t.minutes} value={t.minutes}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">משך הבחינה האמיתית מופיע בנוהל הבחינה של משרד העבודה.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={start} disabled={pending}>
              {pending ? "מכינים בחינה…" : `התחלת בחינה (${examSize} שאלות)`}
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              שאלות אקראיות מהמאגר הרשמי{bankVersion && ` (גרסה ${bankVersion})`}, לפי סוג הרישיון.
            </span>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        </Card>
        <History entries={store.history} />
      </div>
    );
  }

  if (phase.name === "done") {
    return (
      <Results
        questions={questions}
        answers={answers}
        flags={flags}
        grade={phase.grade}
        seconds={phase.seconds}
        level={level}
        onRestart={() => setPhase({ name: "setup" })}
      />
    );
  }

  const q = questions[current]!;
  const answeredCount = Object.keys(answers).length;
  const stateOf = (c: number): OptionState => (answers[q.n] === c ? "selected" : "idle");

  return (
    <div className="space-y-4" ref={topRef}>
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-800">
        <span className="text-sm font-semibold">
          {EXAM_LEVELS[level].title} · נענו {answeredCount} מתוך {questions.length}
        </span>
        <span
          className={cn("font-mono text-sm font-bold tabular-nums", remaining !== null && remaining < 300 && "text-rose-600")}
          aria-live={remaining !== null && remaining < 60 ? "polite" : "off"}
          dir="ltr"
        >
          ⏱ {remaining !== null ? clock(remaining) : clock(elapsed)}
        </span>
        <Button variant="secondary" onClick={() => setConfirming(true)} disabled={pending}>
          הגשת הבחינה
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <QuestionMeta q={q} number={current + 1} />
          <button
            type="button"
            onClick={() =>
              setFlags((f) => {
                const next = new Set(f);
                if (next.has(q.n)) next.delete(q.n);
                else next.add(q.n);
                return next;
              })
            }
            aria-pressed={flags.has(q.n)}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-semibold ring-1",
              flags.has(q.n) ? "bg-amber-100 text-amber-900 ring-amber-300" : "text-slate-600 ring-slate-200 dark:text-slate-300 dark:ring-slate-700",
            )}
          >
            🚩 {flags.has(q.n) ? "מסומנת לבדיקה" : "סימון לבדיקה"}
          </button>
        </div>
        <QuestionStem q={q} />
        <OptionList q={q} stateOf={stateOf} onPick={(c) => setAnswers((a) => ({ ...a, [q.n]: c }))} />
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="secondary" onClick={() => go(current - 1)} disabled={current === 0}>
            → הקודמת
          </Button>
          {current < questions.length - 1 ? (
            <Button onClick={() => go(current + 1)}>הבאה ←</Button>
          ) : (
            <Button onClick={() => setConfirming(true)}>סיום והגשה</Button>
          )}
        </div>
      </Card>

      <nav aria-label="מעבר בין שאלות" className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(25,minmax(0,1fr))]">
        {questions.map((item, i) => (
          <button
            key={item.n}
            type="button"
            onClick={() => go(i)}
            aria-current={i === current ? "step" : undefined}
            aria-label={`שאלה ${i + 1}${answers[item.n] ? ", נענתה" : ""}${flags.has(item.n) ? ", מסומנת" : ""}`}
            className={cn(
              "relative aspect-square rounded-md text-xs font-semibold ring-1 tabular-nums",
              answers[item.n] ? "bg-brand-600 text-white ring-brand-600" : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700",
              i === current && "ring-2 ring-spark-400",
            )}
          >
            {i + 1}
            {flags.has(item.n) && <span aria-hidden className="absolute -top-1 -left-1 size-2.5 rounded-full bg-amber-400" />}
          </button>
        ))}
      </nav>
      <p className="text-xs text-slate-500 dark:text-slate-400">מקלדת: 1–4 לבחירת תשובה, חיצים למעבר בין שאלות.</p>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      {confirming && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <Card className="max-w-sm space-y-3">
            <h2 id="confirm-title" className="text-lg font-bold">
              להגיש את הבחינה?
            </h2>
            <p className="text-sm">
              נענו {answeredCount} מתוך {questions.length} שאלות
              {questions.length - answeredCount > 0 && `; ${questions.length - answeredCount} עדיין ללא תשובה`}
              {flags.size > 0 && `, ו־${flags.size} מסומנות לבדיקה`}.
            </p>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={pending} autoFocus>
                {pending ? "מגישים…" : "הגשה"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                חזרה לבחינה
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Results({
  questions,
  answers,
  flags,
  grade,
  seconds,
  level,
  onRestart,
}: {
  questions: ClientQuestion[];
  answers: Record<number, number>;
  flags: Set<number>;
  grade: ExamGrade;
  seconds: number;
  level: ExamLevel;
  onRestart: () => void;
}) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const withKeys = useMemo(() => questions.map((q) => (grade.keys[q.n] ? { ...q, key: grade.keys[q.n] } : q)), [questions, grade.keys]);
  const answered = Object.keys(answers).length;
  const pct = grade.keyed ? Math.round((grade.correct / grade.keyed) * 100) : null;

  const byTopic = useMemo(() => {
    const m = new Map<ExamTopic, { total: number; answered: number; correct: number; keyed: number }>();
    for (const q of withKeys) {
      const t = m.get(q.topic) ?? { total: 0, answered: 0, correct: 0, keyed: 0 };
      t.total++;
      if (answers[q.n]) t.answered++;
      if (q.key) {
        t.keyed++;
        if (answers[q.n] === q.key.answer) t.correct++;
      }
      m.set(q.topic, t);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [withKeys, answers]);

  const FILTERS: { id: ReviewFilter; label: string; test: (q: ClientQuestion) => boolean }[] = [
    { id: "all", label: "הכול", test: () => true },
    { id: "flagged", label: "מסומנות", test: (q) => flags.has(q.n) },
    { id: "unanswered", label: "ללא תשובה", test: (q) => !answers[q.n] },
    { id: "wrong", label: "שגויות", test: (q) => !!q.key && !!answers[q.n] && answers[q.n] !== q.key.answer },
    { id: "right", label: "נכונות", test: (q) => !!q.key && answers[q.n] === q.key.answer },
    { id: "unkeyed", label: "ללא מפתח", test: (q) => !q.key },
  ];
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = withKeys.map((q, i) => ({ q, i })).filter(({ q }) => active.test(q));

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">סיכום הבחינה · {EXAM_LEVELS[level].title}</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="נענו" value={`${answered} / ${questions.length}`} />
          <Stat label="זמן" value={clock(seconds)} />
          <Stat label="ציון (על שאלות עם מפתח)" value={pct === null ? "—" : `${pct}%`} hint={grade.keyed ? `${grade.correct} נכונות מתוך ${grade.keyed}` : undefined} />
        </dl>
        {grade.keyed < questions.length && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
            למאגר הרשמי אין מפתח תשובות. {grade.keyed ? `${questions.length - grade.keyed} מהשאלות בבחינה` : "השאלות בבחינה"} עוד בלי תשובה מאומתת
            אצלנו, ולכן לא נכנסו לציון. עברו עליהן למטה ובדקו מול התקנות.
          </p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {grade.saved ? "הבחינה נשמרה בחשבון שלכם." : "הבחינה נשמרה בדפדפן הזה. התחברו כדי לשמור אותה גם בחשבון."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRestart}>בחינה חדשה</Button>
          <Link href="/license-exam/practice" className={buttonClass("secondary")}>
            תרגול לפי נושא
          </Link>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">לפי נושא</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {byTopic.map(([topic, t]) => (
            <li key={topic} className="flex items-center justify-between gap-2 text-sm">
              <Link href={`/license-exam/browse?topic=${topic}`} className="hover:underline">
                {EXAM_TOPICS[topic].title}
              </Link>
              <span className="text-slate-600 tabular-nums dark:text-slate-400">
                {t.answered}/{t.total} נענו{t.keyed > 0 && ` · ${t.correct}/${t.keyed} נכונות`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="סינון שאלות">
          {FILTERS.map((f) => {
            const count = withKeys.filter(f.test).length;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold ring-1",
                  filter === f.id ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 dark:ring-slate-700",
                )}
              >
                {f.label} <span className="tabular-nums opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
        {shown.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">אין שאלות בסינון הזה.</p>}
        {shown.map(({ q, i }) => {
          const picked = answers[q.n] ?? null;
          const stateOf = (c: number): OptionState => {
            if (q.key) return c === q.key.answer ? "correct" : c === picked ? "wrong" : "dim";
            return c === picked ? "selected" : "dim";
          };
          return (
            <Card key={q.n} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <QuestionMeta q={q} number={i + 1} />
                <div className="flex gap-2">
                  {flags.has(q.n) && <Badge tone="pro">🚩 סימנתם</Badge>}
                  {!picked && <Badge>לא נענתה</Badge>}
                  <BookmarkButton n={q.n} />
                </div>
              </div>
              <QuestionStem q={q} />
              <OptionList q={q} stateOf={stateOf} />
              <KeyNote q={q} picked={picked} />
              <DiscussionLink n={q.n} />
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <dt className="text-xs text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="text-2xl font-extrabold tabular-nums" dir="ltr">
        {value}
      </dd>
      {hint && <dd className="text-xs text-slate-600 dark:text-slate-400">{hint}</dd>}
    </div>
  );
}

function History({ entries }: { entries: { at: string; level: ExamLevel; total: number; answered: number; keyed: number; correct: number; seconds: number }[] }) {
  if (entries.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-3 font-bold">הבחינות האחרונות שלכם</h2>
      <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
        {entries.slice(0, 8).map((e) => (
          <li key={e.at} className="flex flex-wrap justify-between gap-2 py-2">
            <span>
              {new Date(e.at).toLocaleDateString("he-IL")} · {EXAM_LEVELS[e.level].short}
            </span>
            <span className="text-slate-600 tabular-nums dark:text-slate-400">
              נענו {e.answered}/{e.total}
              {e.keyed > 0 && ` · ${Math.round((e.correct / e.keyed) * 100)}% (${e.correct}/${e.keyed})`} · {clock(e.seconds)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
