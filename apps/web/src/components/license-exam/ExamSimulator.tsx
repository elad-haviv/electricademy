"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge, Button, buttonClass, Card, cn } from "@electricademy/ui";
import { EXAM_LEVELS, EXAM_TOPICS, type ExamLevel, type ExamTopic } from "@electricademy/content/license-exam";
import type { ClientQuestion } from "@/lib/licenseExam";
import { drawExam, gradeExam, type ExamGrade } from "@/lib/licenseExamActions";
import { Modal } from "@/components/Modal";
import { BookmarkButton } from "./BookmarkButton";
import { DiscussionLink, KeyNote, OptionList, QuestionStem, type OptionState } from "./Question";
import { useExamStorage, type ExamHistoryEntry } from "./storage";

/** The licensing exam lasts 3.5 hours; the pass mark is 80%. */
export const EXAM_MINUTES = 210;
export const PASS_MARK = 80;

const TIME_LIMITS = [
  { minutes: EXAM_MINUTES, label: "3.5 שעות (כמו בבחינה)" },
  { minutes: 0, label: "ללא הגבלת זמן" },
];

type Phase = { name: "setup" } | { name: "running" } | { name: "done"; grade: ExamGrade; seconds: number };
type Filter = "all" | "unanswered" | "flagged";
type ReviewFilter = "all" | "flagged" | "unanswered" | "wrong" | "right" | "unkeyed";

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ""}${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export function ExamSimulator({ poolSizes, examSize, bankVersion }: { poolSizes: Record<ExamLevel, number>; examSize: number; bankVersion: string | null }) {
  const store = useExamStorage();
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  // defaults to the licence level the learner chose last time (stored in this browser)
  const [chosenLevel, setLevel] = useState<ExamLevel | null>(null);
  const level = chosenLevel ?? store.level ?? "technician";
  const [minutes, setMinutes] = useState(EXAM_MINUTES);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [sheet, setSheet] = useState<Filter | null>(null);
  const [panelFilter, setPanelFilter] = useState<Filter>("all");
  // screen-reader announcements: time warnings interrupt (assertive); question changes do not (polite)
  const [announce, setAnnounce] = useState("");
  const [navAnnounce, setNavAnnounce] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const submitted = useRef(false);
  const warned = useRef(new Set<number>());

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
        warned.current = new Set();
        setPhase({ name: "running" });
        window.scrollTo({ top: 0 });
      } catch {
        setError("לא הצלחנו להכין בחינה. נסו שוב.");
      }
    });
  };

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const remaining = minutes ? Math.max(0, minutes * 60 - elapsed) : null;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const submit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    setConfirming(false);
    setSheet(null);
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    startTransition(async () => {
      try {
        const grade = await gradeExam({ level, answers, numbers: questions.map((q) => q.n) });
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

  // clock: warnings at 30, 5 and 1 minutes left, and auto-submit at 0
  const submitRef = useRef(submit);
  const unansweredRef = useRef(unansweredCount);
  useEffect(() => {
    submitRef.current = submit;
    unansweredRef.current = unansweredCount;
  }, [submit, unansweredCount]);
  useEffect(() => {
    if (phase.name !== "running") return;
    const deadline = minutes ? startedAt + minutes * 60_000 : null;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!deadline) return;
      const left = Math.ceil((deadline - t) / 1000);
      for (const mark of [1800, 300, 60]) {
        if (left <= mark && !warned.current.has(mark)) {
          warned.current.add(mark);
          const msg = mark === 1800 ? "נותרו 30 דקות" : mark === 300 ? `נותרו 5 דקות · ${unansweredRef.current} ללא תשובה` : "נותרה דקה אחת";
          setAnnounce(msg);
          if (mark === 1800) setToast(msg);
        }
      }
      if (left <= 0) {
        setAnnounce("הזמן נגמר, הבחינה מוגשת");
        submitRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase.name, minutes, startedAt]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // focus mode: hide the site's header, tab bar and footer during the exam; warn before leaving
  useEffect(() => {
    if (phase.name !== "running") return;
    document.body.dataset.examFocus = "true";
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      delete document.body.dataset.examFocus;
      window.removeEventListener("beforeunload", warn);
    };
  }, [phase.name]);

  const go = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), questions.length - 1);
      setCurrent(next);
      setNavAnnounce(`שאלה ${next + 1} מתוך ${questions.length}`);
      setSheet(null);
      topRef.current?.scrollIntoView({ block: "start" });
    },
    [questions.length],
  );

  /** The question overview: the side panel on wide screens, a bottom sheet on phones. */
  const openOverview = (filter: Filter) => {
    setPanelFilter(filter);
    if (window.matchMedia("(min-width: 1024px)").matches) panelRef.current?.focus();
    else setSheet(filter);
  };

  const toggleFlag = useCallback((n: number) => {
    setFlags((f) => {
      const next = new Set(f);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  // keyboard: 1-4 answer, ← next, → previous (right-to-left page), F flag
  useEffect(() => {
    if (phase.name !== "running" || confirming || sheet || exiting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const q = questions[current];
      if (!q) return;
      if (/^[1-4]$/.test(e.key)) setAnswers((a) => ({ ...a, [q.n]: Number(e.key) }));
      else if (e.key === "ArrowLeft") go(current + 1);
      else if (e.key === "ArrowRight") go(current - 1);
      else if (e.key.toLowerCase() === "f" || e.key === "כ") toggleFlag(q.n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase.name, confirming, sheet, exiting, questions, current, go, toggleFlag]);

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
            <span className="mb-1 block font-bold">זמן</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-control sm:w-72 dark:bg-slate-900 dark:ring-control-dark"
            >
              {TIME_LIMITS.map((t) => (
                <option key={t.minutes} value={t.minutes}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <strong>{examSize} שאלות</strong> אמריקאיות, באקראי מהמאגר הרשמי{bankVersion && ` (גרסה ${bankVersion})`}
            </li>
            <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <strong>3.5 שעות</strong>, כמו בבחינה האמיתית
            </li>
            <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <strong>ציון עובר: {PASS_MARK}</strong>. שאלה בלי תשובה נספרת כשגויה
            </li>
          </ul>
          <Button onClick={start} disabled={pending}>
            {pending ? "מכינים בחינה…" : `התחלת בחינה`}
          </Button>
          {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
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
  const stateOf = (c: number): OptionState => (answers[q.n] === c ? "selected" : "idle");
  const timerTone = remaining === null ? "" : remaining <= 300 ? "text-rose-600 dark:text-rose-400" : remaining <= 1800 ? "text-amber-700 dark:text-amber-400" : "";
  const isLast = current === questions.length - 1;
  const overviewProps = { questions, answers, flags, current, onJump: go };

  return (
    <div ref={topRef} className="scroll-mt-4 pb-24 lg:pb-0">
      {/* the page heading is hidden with the site chrome in focus mode */}
      <h1 className="sr-only">סימולציית בחינה</h1>
      <p className="sr-only" aria-live="assertive">
        {announce}
      </p>
      <p className="sr-only" aria-live="polite">
        {navAnnounce}
      </p>

      {/* top bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:mx-0 lg:rounded-2xl lg:border dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex h-14 items-center gap-3">
          <button
            type="button"
            onClick={() => setExiting(true)}
            aria-label="יציאה מהבחינה"
            className="grid size-11 place-items-center rounded-lg text-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span aria-hidden>✕</span>
          </button>
          <h2 className="flex-1 font-bold">
            שאלה {current + 1} מתוך {questions.length}
            <span className="ms-2 hidden text-sm font-normal text-slate-600 sm:inline dark:text-slate-400">· {EXAM_LEVELS[level].title}</span>
          </h2>
          <span className={cn("font-mono text-base font-bold tabular-nums lg:hidden", timerTone)} dir="ltr" role="timer" aria-label={remaining !== null ? "זמן שנותר" : "זמן שעבר"}>
            {remaining !== null ? clock(remaining) : clock(elapsed)}
          </span>
        </div>
        <div
          className="mb-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-label="שאלות שנענו"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
        >
          <div className="h-full bg-blue-600 transition-all dark:bg-blue-400" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>

      {remaining !== null && remaining <= 300 && remaining > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900">
          <span>
            נותרו {Math.ceil(remaining / 60)} דקות · {unansweredCount} ללא תשובה
          </span>
          {unansweredCount > 0 && (
            <button type="button" className="min-h-6 underline" onClick={() => openOverview("unanswered")}>
              הצגת השאלות ללא תשובה
            </button>
          )}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <Badge tone="brand">{EXAM_TOPICS[q.topic].title}</Badge>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  מאגר: שאלה {q.n}
                  {q.serial && ` · קוד ${q.serial}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFlag(q.n)}
                aria-pressed={flags.has(q.n)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1",
                  flags.has(q.n)
                    ? "bg-amber-100 text-amber-900 ring-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-600"
                    : "text-slate-600 ring-slate-300 dark:text-slate-300 dark:ring-slate-700",
                )}
              >
                <span aria-hidden>🚩</span> {flags.has(q.n) ? "מסומנת" : "סימון"}
              </button>
            </div>
            <QuestionStem q={q} />
            <OptionList q={q} stateOf={stateOf} onPick={(c) => setAnswers((a) => ({ ...a, [q.n]: c }))} />
          </Card>

          {/* desktop prev / next */}
          <div className="hidden justify-between gap-2 lg:flex">
            <Button variant="secondary" onClick={() => go(current - 1)} disabled={current === 0}>
              → הקודמת
            </Button>
            {isLast ? <Button onClick={() => setConfirming(true)}>סיום והגשה</Button> : <Button onClick={() => go(current + 1)}>הבאה ←</Button>}
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        {/* desktop side panel */}
        <aside
          ref={panelRef}
          tabIndex={-1}
          aria-label="סקירת שאלות"
          className="sticky top-4 hidden space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 lg:block dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{remaining !== null ? "זמן שנותר" : "זמן שעבר"}</p>
            <p className={cn("font-mono text-3xl font-extrabold tabular-nums", timerTone)} dir="ltr" role="timer">
              {remaining !== null ? clock(remaining) : clock(elapsed)}
            </p>
            <p className="mt-1 text-sm text-slate-600 tabular-nums dark:text-slate-400">
              נענו {answeredCount}/{questions.length}
            </p>
          </div>
          <Overview {...overviewProps} filter={panelFilter} onFilter={setPanelFilter} size="sm" />
          <p className="text-xs text-slate-500 dark:text-slate-400">מקלדת: 1–4 תשובה · חיצים מעבר · F סימון</p>
          <Button className="w-full" variant="secondary" onClick={() => setConfirming(true)} disabled={pending}>
            הגשת הבחינה
          </Button>
        </aside>
      </div>

      {/* mobile bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto grid h-16 max-w-3xl grid-cols-3 items-center gap-2 px-3">
          <Button variant="secondary" onClick={() => go(current - 1)} disabled={current === 0}>
            → הקודמת
          </Button>
          <Button ref={reviewRef} variant="ghost" className="px-2 whitespace-nowrap" onClick={() => setSheet("all")} aria-haspopup="dialog">
            סקירה <span className="tabular-nums">{answeredCount}/{questions.length}</span>
          </Button>
          {isLast ? <Button onClick={() => setConfirming(true)}>סיום והגשה</Button> : <Button onClick={() => go(current + 1)}>הבאה ←</Button>}
        </div>
      </div>

      {/* mobile overview sheet */}
      {sheet && (
        <Modal
          variant="sheet"
          title="סקירת שאלות"
          onClose={() => setSheet(null)}
          returnFocus={reviewRef}
          className="h-[85dvh]"
          headerExtra={
            <span className={cn("ms-auto font-mono font-bold tabular-nums", timerTone)} dir="ltr">
              {remaining !== null ? clock(remaining) : clock(elapsed)}
            </span>
          }
        >
          <div className="flex-1 overflow-y-auto px-5 py-1">
            <Overview {...overviewProps} filter={sheet} onFilter={setSheet} size="lg" />
          </div>
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <Button
              className="w-full"
              onClick={() => {
                setSheet(null);
                setConfirming(true);
              }}
            >
              הגשת הבחינה
            </Button>
          </div>
        </Modal>
      )}

      {toast && (
        // visual only: the same warning is announced through the assertive region above
        <div aria-hidden className="fixed inset-x-4 top-20 z-40 mx-auto max-w-sm rounded-xl bg-amber-100 p-3 text-center text-sm font-semibold text-amber-900 shadow-lg ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800">
          ⏳ {toast}
        </div>
      )}

      {confirming && (
        <Modal title="להגיש את הבחינה?" onClose={() => setConfirming(false)} returnFocus={reviewRef}>
          <div className="space-y-4 px-5 pb-5">
            {remaining !== null && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                נותר זמן: <span dir="ltr" className="font-mono">{clock(remaining)}</span>
              </p>
            )}
            <ul className="divide-y divide-slate-200 rounded-xl ring-1 ring-slate-200 dark:divide-slate-800 dark:ring-slate-800">
              <li className="flex justify-between p-3">
                <span>נענו</span>
                <strong className="tabular-nums">{answeredCount}</strong>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full justify-between p-3 text-start"
                  onClick={() => {
                    setConfirming(false);
                    openOverview("unanswered");
                  }}
                >
                  <span>
                  ללא תשובה <span aria-hidden>›</span>
                </span>
                  <strong className="tabular-nums">{unansweredCount}</strong>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full justify-between p-3 text-start"
                  onClick={() => {
                    setConfirming(false);
                    openOverview("flagged");
                  }}
                >
                  <span>
                  מסומנות <span aria-hidden>›</span>
                </span>
                  <strong className="tabular-nums">{flags.size}</strong>
                </button>
              </li>
            </ul>
            {unansweredCount > 0 && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900">
                שאלה בלי תשובה נספרת כשגויה, עדיף לנחש.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant={unansweredCount ? "primary" : "secondary"} onClick={() => setConfirming(false)} data-autofocus={unansweredCount > 0 || undefined}>
                חזרה לבחינה
              </Button>
              <Button variant={unansweredCount ? "secondary" : "primary"} onClick={submit} disabled={pending} data-autofocus={unansweredCount === 0 || undefined}>
                {pending ? "מגישים…" : "הגשה סופית"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {exiting && (
        <Modal title="לצאת מהבחינה?" onClose={() => setExiting(false)}>
          <div className="space-y-4 px-5 pb-5">
            <p className="text-sm">הבחינה לא תישמר והתשובות יאבדו.</p>
            <div className="flex gap-2">
              <Button onClick={() => setExiting(false)} data-autofocus>
                חזרה לבחינה
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setExiting(false);
                  setPhase({ name: "setup" });
                }}
              >
                יציאה
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Question chips with filters. State shows by fill (answered), a flag badge, and a ring (current). */
function Overview({
  questions,
  answers,
  flags,
  current,
  onJump,
  filter,
  onFilter,
  size,
}: {
  questions: ClientQuestion[];
  answers: Record<number, number>;
  flags: Set<number>;
  current: number;
  onJump: (i: number) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
  size: "sm" | "lg";
}) {
  const unanswered = questions.filter((q) => !answers[q.n]).length;
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "הכול", count: questions.length },
    { id: "unanswered", label: "ללא תשובה", count: unanswered },
    { id: "flagged", label: "מסומנות", count: flags.size },
  ];
  const shown = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => (filter === "unanswered" ? !answers[q.n] : filter === "flagged" ? flags.has(q.n) : true));
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5" role="group" aria-label="סינון שאלות">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={filter === t.id}
            onClick={() => onFilter(t.id)}
            className={cn(
              "min-h-8 flex-1 rounded-full px-2 py-1.5 text-xs font-semibold whitespace-nowrap ring-1",
              filter === t.id ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white" : "ring-slate-300 dark:ring-slate-700",
            )}
          >
            {t.label} <span className="tabular-nums">({t.count})</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">{filter === "unanswered" ? "כל השאלות נענו" : "אין שאלות מסומנות"}</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {shown.map(({ q, i }) => {
            const answered = Boolean(answers[q.n]);
            const flagged = flags.has(q.n);
            return (
              <button
                key={q.n}
                type="button"
                onClick={() => onJump(i)}
                aria-current={i === current ? "step" : undefined}
                aria-label={`שאלה ${i + 1}${answered ? ", נענתה" : ", ללא תשובה"}${flagged ? ", מסומנת" : ""}`}
                className={cn(
                  "relative grid place-items-center rounded-lg text-sm font-bold tabular-nums",
                  size === "lg" ? "h-12" : "h-10",
                  answered
                    ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                    : "border border-slate-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100",
                  flagged && "outline-2 outline-amber-700 focus-visible:outline-offset-4 focus-visible:outline-brand-600 dark:outline-amber-400 dark:focus-visible:outline-brand-300",
                  i === current && "ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900",
                )}
              >
                {i + 1}
                {flagged && (
                  <span aria-hidden className="absolute -top-2 -right-1.5 text-xs">
                    🚩
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-3 rounded bg-blue-600 dark:bg-blue-400" /> נענתה
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-3 rounded border border-slate-500" /> ללא תשובה
        </span>
        <span>
          <span aria-hidden>🚩</span> מסומנת
        </span>
      </p>
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
  const withKeys = useMemo(() => questions.map((q) => (grade.keys[q.n] ? { ...q, key: grade.keys[q.n] } : q)), [questions, grade.keys]);
  const wrongCount = withKeys.filter((q) => q.key && answers[q.n] !== q.key.answer).length;
  const [filter, setFilter] = useState<ReviewFilter>(wrongCount ? "wrong" : "all");
  const pct = grade.keyed ? Math.round((grade.correct / grade.keyed) * 100) : null;
  const complete = grade.keyed === questions.length;
  const passed = pct !== null && pct >= PASS_MARK;
  const needed = Math.ceil((PASS_MARK / 100) * grade.keyed) - grade.correct;

  const weakest = useMemo(() => {
    const m = new Map<ExamTopic, { keyed: number; correct: number }>();
    for (const q of withKeys) {
      if (!q.key) continue;
      const t = m.get(q.topic) ?? { keyed: 0, correct: 0 };
      t.keyed++;
      if (answers[q.n] === q.key.answer) t.correct++;
      m.set(q.topic, t);
    }
    return [...m.entries()]
      .filter(([, t]) => t.correct < t.keyed)
      .sort((a, b) => a[1].correct / a[1].keyed - b[1].correct / b[1].keyed || b[1].keyed - a[1].keyed)
      .slice(0, 3);
  }, [withKeys, answers]);

  const FILTERS: { id: ReviewFilter; label: string; test: (q: ClientQuestion) => boolean }[] = [
    { id: "wrong", label: "שגויות", test: (q) => !!q.key && answers[q.n] !== q.key.answer },
    { id: "all", label: "הכול", test: () => true },
    { id: "right", label: "נכונות", test: (q) => !!q.key && answers[q.n] === q.key.answer },
    { id: "unanswered", label: "ללא תשובה", test: (q) => !answers[q.n] },
    { id: "flagged", label: "מסומנות", test: (q) => flags.has(q.n) },
    { id: "unkeyed", label: "ללא מפתח", test: (q) => !q.key },
  ];
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = withKeys.map((q, i) => ({ q, i })).filter(({ q }) => active.test(q));

  return (
    <div className="space-y-6">
      <Card className="space-y-4 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {EXAM_LEVELS[level].title} · {clock(seconds)}
        </p>
        {pct === null ? (
          <p className="text-2xl font-extrabold">הבחינה הוגשה</p>
        ) : (
          <>
            {complete ? (
              <p className={cn("text-4xl font-black", passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {passed ? (
                  <>
                    עברת <span aria-hidden>✓</span>
                  </>
                ) : (
                  "לא עברת"
                )}
              </p>
            ) : (
              <p className="text-lg font-bold">ציון חלקי (על {grade.keyed} שאלות עם מפתח)</p>
            )}
            <p className="text-5xl font-black tabular-nums" dir="ltr">
              {pct}%
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {grade.correct}/{grade.keyed} נכונות · ציון עובר {PASS_MARK}
            </p>
            <div className="relative mx-auto h-3 max-w-md rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden>
              <div className={cn("h-full rounded-full", passed ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${pct}%` }} />
              <div className="absolute inset-y-[-4px] w-0.5 bg-slate-900 dark:bg-white" style={{ insetInlineStart: `${PASS_MARK}%` }} />
            </div>
            {!passed && needed > 0 && <p className="font-semibold">חסרו {needed} תשובות נכונות למעבר</p>}
          </>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {grade.saved ? "הבחינה נשמרה בחשבון שלכם." : "הבחינה נשמרה בדפדפן הזה."} התשובות במפתח נוסחו בעזרת בינה מלאכותית ועוד לא נבדקו כולן.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onRestart}>בחינה חדשה</Button>
          <Link href="/license-exam/practice" className={buttonClass("secondary")}>
            תרגול לפי נושא
          </Link>
        </div>
      </Card>

      {weakest.length > 0 && (
        <Card>
          <h2 className="mb-3 font-bold">הנושאים לחיזוק</h2>
          <ul className="space-y-2">
            {weakest.map(([topic, t]) => (
              <li key={topic} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {EXAM_TOPICS[topic].title}{" "}
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    ({t.correct}/{t.keyed})
                  </span>
                </span>
                <Link href={`/license-exam/practice?topic=${topic}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                  תרגול <span className="sr-only">{EXAM_TOPICS[topic].title}</span> <span aria-hidden>←</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="sr-only">השאלות בבחינה</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="סינון שאלות">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("min-h-8 rounded-full px-3 py-1 text-sm font-semibold ring-1", filter === f.id ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-300 dark:ring-slate-600")}
            >
              {f.label} <span className="tabular-nums">({withKeys.filter(f.test).length})</span>
            </button>
          ))}
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
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">שאלה {i + 1}</h3>
                  <Badge tone="brand">{EXAM_TOPICS[q.topic].title}</Badge>
                </div>
                <div className="flex gap-2">
                  {flags.has(q.n) && (
                    <Badge tone="pro">
                      <span aria-hidden>🚩</span> סימנתם
                    </Badge>
                  )}
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

function History({ entries }: { entries: ExamHistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-3 font-bold">הבחינות האחרונות שלכם</h2>
      <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
        {entries.slice(0, 8).map((e) => {
          const pct = e.keyed ? Math.round((e.correct / e.keyed) * 100) : null;
          return (
            <li key={e.at} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {new Date(e.at).toLocaleDateString("he-IL")} · {EXAM_LEVELS[e.level].short}
              </span>
              <span className="flex items-center gap-2 text-slate-600 tabular-nums dark:text-slate-400">
                {pct !== null && <span className={cn("font-bold", pct >= PASS_MARK ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{pct}%</span>}
                נענו {e.answered}/{e.total} · {clock(e.seconds)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
