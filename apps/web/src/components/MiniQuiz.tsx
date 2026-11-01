"use client";

import { useState } from "react";
import { cn, IconCheckCircle, IconXCircle } from "@electricademy/ui";

const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו"];

export function MiniQuiz({
  question,
  choices,
  answer,
  explanation,
}: {
  question: string;
  choices: string[];
  answer: number;
  explanation?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === answer;
  return (
    <section className="not-prose my-10 rounded-2xl bg-white p-5 shadow-(--shadow-card) ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <p className="mb-1 text-sm font-bold text-brand-700 dark:text-brand-300">בדקו את עצמכם</p>
      <p className="mb-5 text-lg leading-snug font-bold text-slate-950 dark:text-white">{question}</p>
      <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="תשובות">
        {choices.map((choice, i) => {
          const isAnswer = answered && i === answer;
          const isWrongPick = answered && i === picked && i !== answer;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={cn(
                "flex min-h-13 items-center gap-3 rounded-xl px-3 py-2.5 text-start text-base ring-1 transition",
                !answered && "ring-slate-300 hover:bg-brand-50 hover:ring-brand-400 dark:ring-slate-700 dark:hover:bg-slate-800",
                isAnswer && "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/50",
                isWrongPick && "bg-rose-50 ring-2 ring-rose-500 dark:bg-rose-950/50",
                answered && !isAnswer && !isWrongPick && "opacity-55 ring-slate-200 dark:ring-slate-700",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isAnswer
                    ? "bg-emerald-600 text-white"
                    : isWrongPick
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span dir="auto" className="flex-1 font-medium">
                {choice}
              </span>
              {isAnswer && <IconCheckCircle className="size-5 text-emerald-600" title="התשובה הנכונה" />}
              {isWrongPick && <IconXCircle className="size-5 text-rose-600" title="הבחירה שלכם" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <div
            className={cn(
              "mt-5 rounded-xl p-4 text-base",
              correct ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100" : "bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100",
            )}
          >
            <p className="font-bold">{correct ? "נכון! כל הכבוד." : "לא בדיוק. הנה ההסבר:"}</p>
            {explanation && (
              <p dir="auto" className="mt-1">
                {explanation}
              </p>
            )}
            {!correct && (
              <button
                type="button"
                className="mt-2 font-bold text-brand-700 underline underline-offset-4 dark:text-brand-300"
                onClick={() => setPicked(null)}
              >
                לנסות שוב
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
