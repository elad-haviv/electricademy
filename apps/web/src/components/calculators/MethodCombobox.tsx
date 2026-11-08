"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { IlInstallationMethod } from "@electricademy/calc";
import { cn } from "@electricademy/ui";

/** Drawing of a third-schedule item, cropped from the Reshumot scan (קובץ התקנות 7349). */
export function methodImage(item: number): string {
  return `/images/legislation/conductor-loading-and-protection/method-${String(item).padStart(2, "0")}.webp`;
}

/** Normalizes Hebrew codes so "יח", "י״ח" and "י\"ח" all match. */
function normalize(text: string): string {
  return text.replace(/[״"׳'\s()–-]/g, "").toLowerCase();
}

function Thumb({ item, className }: { item: number; className?: string }) {
  return (
    // Line drawings from a scan: always on white so they read in dark mode too.
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-slate-200 dark:ring-slate-700", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-optimized WebP, images are unoptimized anyway */}
      <img src={methodImage(item)} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  );
}

/**
 * Select-only combobox for the installation methods of the third schedule: a button shows the
 * chosen method with its drawing; the popup has a filter field and a listbox of all methods.
 * Keyboard: ↑/↓, Home/End, Enter to choose, Esc to close.
 */
export function MethodCombobox({
  label,
  methods,
  value,
  onChange,
  insulation,
}: {
  label: string;
  /** Insulation rating, to name the Iz table (70.n / 90.n) of each method. */
  insulation: number;
  methods: readonly IlInstallationMethod[];
  value: string;
  onChange: (id: string) => void;
}) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = methods.find((m) => m.id === value) ?? methods[0]!;
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return methods;
    return methods.filter((m) => normalize(m.code).startsWith(q) || normalize(m.description).includes(q));
  }, [methods, query]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, methods.findIndex((m) => m.id === value)));
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (m: IlInstallationMethod) => {
    onChange(m.id);
    close(true);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = filtered.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(last, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter": {
        e.preventDefault();
        const m = filtered[active];
        if (m) choose(m);
        break;
      }
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const activeOption = filtered[active];

  return (
    <div ref={rootRef} className="relative text-sm">
      <span id={`${baseId}-label`} className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${baseId}-label ${baseId}-value`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openList();
          }
        }}
        className="flex w-full items-center gap-3 rounded-xl bg-white p-2 text-start ring-1 ring-control outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:bg-slate-950 dark:ring-control-dark dark:focus-visible:ring-brand-300"
      >
        <Thumb item={selected.item} className="h-20 w-28" />
        <span id={`${baseId}-value`} className="min-w-0 flex-1">
          <span className="block font-bold">שיטה {selected.code}</span>
          <span className="block text-slate-600 dark:text-slate-400">{selected.description}</span>
        </span>
        <span aria-hidden className="px-1 text-slate-500 dark:text-slate-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="border-b border-slate-200 p-2 dark:border-slate-700">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeOption ? `${baseId}-opt-${activeOption.id}` : undefined}
              aria-label="חיפוש שיטת התקנה"
              placeholder="חיפוש לפי אות או תיאור (למשל: יב, מגש, אדמה)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              className="w-full rounded-lg bg-slate-50 px-3 py-2 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:ring-slate-700"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-labelledby={`${baseId}-label`} className="max-h-[min(24rem,60vh)] overflow-y-auto p-1">
            {filtered.map((m, i) => (
              <li
                key={m.id}
                id={`${baseId}-opt-${m.id}`}
                data-index={i}
                role="option"
                aria-selected={m.id === value}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(m)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg p-2",
                  i === active && "bg-brand-50 dark:bg-brand-950/60",
                  m.id === value && "font-semibold",
                )}
              >
                <Thumb item={m.item} className="h-16 w-24" />
                <span className="min-w-0 flex-1">
                  <span className="block">
                    שיטה {m.code}
                    <span className="ms-2 text-xs font-normal text-slate-500 dark:text-slate-400">טבלה {insulation}.{m.table}</span>
                  </span>
                  <span className="block font-normal text-slate-600 dark:text-slate-400">{m.description}</span>
                </span>
                {m.id === value && (
                  <span aria-hidden className="text-brand-600">
                    ✓
                  </span>
                )}
              </li>
            ))}
            {filtered.length === 0 && <li className="p-3 text-slate-500 dark:text-slate-400">לא נמצאה שיטה מתאימה</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
