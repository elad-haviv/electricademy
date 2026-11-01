"use client";

import type { ReactNode } from "react";
import { cn, inputClass, labelClass } from "@electricademy/ui";

export function NumberField({
  label,
  unit,
  value,
  onChange,
  step = "any",
  min = 0,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number | "any";
  min?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <span className="flex min-h-11 items-center rounded-xl bg-white ring-1 ring-slate-300 transition hover:ring-slate-400 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-900 dark:ring-slate-700">
        <input
          type="number"
          inputMode="decimal"
          dir="ltr"
          className="w-full bg-transparent px-3.5 py-2.5 text-start text-base tabular-nums outline-none focus-visible:outline-none"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
        {unit && (
          <span className="me-1 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" dir="ltr">
            {unit}
          </span>
        )}
      </span>
    </label>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        className={inputClass}
        value={String(value)}
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          if (opt) onChange(opt.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ResultBox({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "warn" | "error" }) {
  const toneClass = {
    ok: "bg-brand-50 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-900",
    warn: "bg-amber-50 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900",
    error: "bg-rose-50 ring-rose-200 dark:bg-rose-950/40 dark:ring-rose-900",
  }[tone];
  return (
    <div role="status" aria-live="polite" className={cn("mt-6 rounded-xl p-4 ring-1 sm:p-5 [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:tabular-nums", toneClass)}>
      {children}
    </div>
  );
}

export function fmt(n: number, digits = 2): string {
  return new Intl.NumberFormat("he-IL", { maximumFractionDigits: digits }).format(n);
}
