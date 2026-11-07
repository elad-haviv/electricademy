import Link from "next/link";
import { Badge, cn } from "@electricademy/ui";
import {
  ANSWER_BASIS_LABELS,
  EXAM_TOPICS,
  lawSectionHref,
  SCOPE_LABELS,
  type AnswerConfidence,
} from "@electricademy/content/license-exam";
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

const CONFIDENCE: Record<AnswerConfidence, { label: string; tone: "success" | "brand" | "pro" }> = {
  high: { label: "ודאות גבוהה", tone: "success" },
  medium: { label: "ודאות בינונית", tone: "brand" },
  low: { label: "ודאות נמוכה", tone: "pro" },
};

/** Shown under a question once its answer may be revealed. */
export function KeyNote({ q, picked }: { q: ClientQuestion; picked?: number | null }) {
  const k = q.key;
  if (!k) {
    return (
      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
        למאגר הרשמי אין מפתח תשובות, ולשאלה הזו עוד אין תשובה אצלנו. כדאי לבדוק מול התקנות ולשאול בדיון.
      </p>
    );
  }
  const right = picked === k.answer;
  return (
    <div role="status" className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {picked != null && <strong>{right ? "✅ נכון!" : "❌ לא נכון."}</strong>}
        <span>
          התשובה: <strong>{OPTION_LABELS[k.answer - 1]}</strong>
        </span>
        {k.basis?.map((b) => (
          <Badge key={b}>{ANSWER_BASIS_LABELS[b]}</Badge>
        ))}
        {k.confidence && <Badge tone={CONFIDENCE[k.confidence].tone}>{CONFIDENCE[k.confidence].label}</Badge>}
      </div>

      {k.explanation && <p className="leading-relaxed">{k.explanation}</p>}

      {k.calculation && (
        <div>
          <p className="mb-1 font-semibold">חישוב</p>
          <pre className="font-sans whitespace-pre-wrap rounded-lg bg-white p-3 leading-relaxed ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800" dir="auto">
            {k.calculation}
          </pre>
        </div>
      )}

      {k.references && k.references.length > 0 && (
        <div>
          <p className="mb-1 font-semibold">מקורות</p>
          <ul className="space-y-2">
            {k.references.map((r, i) => {
              const href = lawSectionHref(r);
              const label = `${r.title}${r.section ? `, סעיף ${r.section}` : ""}`;
              return (
                <li key={i}>
                  {href ? (
                    <Link href={href} className="font-semibold text-brand-700 underline dark:text-brand-300">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{label}</span>
                  )}
                  {r.quote && (
                    <blockquote className="mt-1 border-s-4 border-slate-300 ps-3 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                      &quot;{r.quote}&quot;
                      {r.quoteUnverified && <span className="ms-1 text-xs text-amber-700 dark:text-amber-400">(לא נמצא מילה במילה בנוסח שבאתר)</span>}
                    </blockquote>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {k.interpretation && (
        <div>
          <p className="mb-1 font-semibold">ועדת הפרשנות</p>
          <p>{k.interpretation}</p>
        </div>
      )}

      {k.source && <p className="text-slate-500 dark:text-slate-400">מקור: {k.source}</p>}
      {k.note && <p className="text-amber-800 dark:text-amber-300">הערה: {k.note}</p>}

      {k.status !== "verified" && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          התשובה וההסבר נוסחו בעזרת בינה מלאכותית ועוד לא נבדקו על ידי חשמלאי מוסמך. מצאתם טעות? כתבו בדיון על השאלה.
        </p>
      )}
    </div>
  );
}

/** Opens the question's discussion in a new tab, so an exam or practice session in progress is kept. */
export function DiscussionLink({ n }: { n: number }) {
  return (
    <a href={`/license-exam/q/${n}#discussion`} target="_blank" rel="noopener" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
      💬 דיון על השאלה ↗
    </a>
  );
}
