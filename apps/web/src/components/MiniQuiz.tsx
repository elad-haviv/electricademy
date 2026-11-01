"use client";

import { useState } from "react";
import { cn } from "@electricademy/ui";

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
  return (
    <section className="my-8 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <p className="mb-1 text-xs font-semibold text-brand-700 dark:text-brand-300">שאלת בדיקה</p>
      <p className="mb-4 font-semibold">{question}</p>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="תשובות">
        {choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => setPicked(i)}
            className={cn(
              "rounded-xl px-4 py-3 text-start ring-1 transition",
              !answered && "ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800",
              answered && i === answer && "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/50",
              answered && i === picked && i !== answer && "bg-rose-50 ring-2 ring-rose-500 dark:bg-rose-950/50",
              answered && i !== answer && i !== picked && "opacity-60 ring-slate-200 dark:ring-slate-700",
            )}
          >
            <span dir="auto">{choice}</span>
          </button>
        ))}
      </div>
      {answered && (
        <p role="status" className="mt-4 text-sm">
          <strong>{picked === answer ? "✅ נכון!" : "❌ לא בדיוק."}</strong> {explanation}
          {picked !== answer && (
            <button type="button" className="ms-2 font-semibold text-brand-700 underline dark:text-brand-300" onClick={() => setPicked(null)}>
              לנסות שוב
            </button>
          )}
        </p>
      )}
    </section>
  );
}
