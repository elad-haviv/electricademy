"use client";

import type { ReactNode } from "react";

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
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className="flex items-center rounded-xl bg-white ring-1 ring-control focus-within:ring-2 focus-within:ring-brand-600 dark:bg-slate-950 dark:ring-control-dark dark:focus-within:ring-brand-300">
        <input
          type="number"
          inputMode="decimal"
          dir="ltr"
          className="w-full bg-transparent px-3 py-2 text-start outline-none"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
        {unit && <span className="px-3 text-slate-500 dark:text-slate-400" dir="ltr">{unit}</span>}
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
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <select
        className="w-full rounded-xl bg-white px-3 py-2 ring-1 ring-control outline-none focus:ring-2 focus:ring-brand-600 dark:bg-slate-950 dark:ring-control-dark dark:focus:ring-brand-300"
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
    <div role="status" aria-live="polite" className={`mt-4 rounded-xl p-4 ring-1 ${toneClass}`}>
      {children}
    </div>
  );
}

export function fmt(n: number, digits = 2): string {
  return new Intl.NumberFormat("he-IL", { maximumFractionDigits: digits }).format(n);
}
