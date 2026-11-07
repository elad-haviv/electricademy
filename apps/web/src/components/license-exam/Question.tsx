import { Badge, cn } from "@electricademy/ui";
import { EXAM_TOPICS, SCOPE_LABELS } from "@electricademy/content/license-exam";
import type { ClientFigure, ClientQuestion } from "@/lib/licenseExam";

// The bank numbers its options 1-4; keep that so learners can match the PDF.
const OPTION_LABELS = ["1", "2", "3", "4"];

/** Figures are cropped from a white PDF page, so they keep a white card in dark mode too. */
export function Figure({ figure, className }: { figure: ClientFigure; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP crops, served as-is
    <img
      src={figure.src}
      alt={figure.alt}
      width={figure.w}
      height={figure.h}
      loading="lazy"
      decoding="async"
      // 200 dpi crops: show them at roughly the PDF's printed size
      style={{ width: Math.round(figure.w * 0.5) }}
      className={cn("h-auto max-w-full rounded-lg bg-white p-1 ring-1 ring-slate-200 dark:ring-slate-700", className)}
    />
  );
}

export function QuestionMeta({ q, number }: { q: ClientQuestion; number?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {number !== undefined && <span className="font-bold text-brand-700 dark:text-brand-300">שאלה {number}</span>}
      <span className="text-slate-500 dark:text-slate-400">
        מאגר: שאלה {q.n}
        {q.serial && <> · קוד {q.serial}</>}
      </span>
      <Badge tone="brand">{EXAM_TOPICS[q.topic].title}</Badge>
      {q.level !== "all" && <Badge tone="pro">{SCOPE_LABELS[q.level]}</Badge>}
    </div>
  );
}

export function QuestionStem({ q }: { q: ClientQuestion }) {
  return (
    <div className="space-y-3">
      {q.stemRendered ? (
        <p className="sr-only">{q.stem.join(" ")}</p>
      ) : (
        q.stem.map((p, i) => (
          <p key={i} className="leading-relaxed font-medium">
            {p}
          </p>
        ))
      )}
      {q.figures.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {q.figures.map((f) => (
            <Figure key={f.src} figure={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dim";

export function OptionContent({ option, index }: { option: ClientQuestion["options"][number]; index: number }) {
  return (
    <span className="flex items-start gap-3">
      <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">
        {OPTION_LABELS[index]}
      </span>
      <span className="min-w-0 space-y-2">
        {option.rendered ? <span className="sr-only">{option.text}</span> : option.text && <span className="block">{option.text}</span>}
        {option.figures.map((f) => (
          <Figure key={f.src} figure={f} className="block" />
        ))}
      </span>
    </span>
  );
}

const STATE_CLASS: Record<OptionState, string> = {
  idle: "ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800",
  selected: "bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950/50",
  correct: "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/50",
  wrong: "bg-rose-50 ring-2 ring-rose-500 dark:bg-rose-950/50",
  dim: "opacity-60 ring-slate-200 dark:ring-slate-700",
};

/** The four options. Interactive when onPick is given; stateOf decides each option's look. */
export function OptionList({
  q,
  stateOf,
  onPick,
  disabled,
}: {
  q: ClientQuestion;
  stateOf: (choice: number) => OptionState;
  onPick?: (choice: number) => void;
  disabled?: boolean;
}) {
  return (
    <ol className="grid gap-2" aria-label="תשובות">
      {q.options.map((o, i) => {
        const choice = i + 1;
        const state = stateOf(choice);
        const cls = cn("w-full rounded-xl px-4 py-3 text-start ring-1 transition", STATE_CLASS[state]);
        return (
          <li key={i}>
            {onPick ? (
              <button type="button" className={cls} disabled={disabled} aria-pressed={state === "selected"} onClick={() => onPick(choice)}>
                <OptionContent option={o} index={i} />
              </button>
            ) : (
              <div className={cls}>
                <OptionContent option={o} index={i} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Shown under a question once its answer may be revealed. */
export function KeyNote({ q, picked }: { q: ClientQuestion; picked?: number | null }) {
  if (!q.key) {
    return (
      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
        למאגר הרשמי אין מפתח תשובות, ולשאלה הזו עוד לא הוספנו תשובה מאומתת. כדאי לבדוק מול התקנות.
      </p>
    );
  }
  const right = picked === q.key.answer;
  return (
    <div role="status" className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      {picked != null && <p className="font-bold">{right ? "✅ נכון!" : "❌ לא נכון."}</p>}
      <p>
        התשובה הנכונה: <strong>{OPTION_LABELS[q.key.answer - 1]}</strong>
      </p>
      {q.key.explanation && <p>{q.key.explanation}</p>}
      {q.key.source && <p className="text-slate-500 dark:text-slate-400">מקור: {q.key.source}</p>}
    </div>
  );
}
