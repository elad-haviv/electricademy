"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@electricademy/ui";
import { CATEGORY_INFO, OPTIONAL_CATEGORIES, type OptionalCategory } from "@/lib/consent/registry";
import { NO_CONSENT, type ConsentChoices } from "@/lib/consent/state";
import { acceptAll, closeConsentSettings, openConsentSettings, rejectAll, saveConsent, useConsent } from "@/lib/consent/store";

/**
 * First layer (banner) + second layer (settings dialog). Rendered once, in the root layout.
 * EDPB rules this follows: nothing optional before a choice, "accept all" and "reject all" side by
 * side with the same styling, nothing pre-ticked, no cookie wall (the banner never blocks the page).
 */

/** Same classes for accept and reject: neither is visually preferred. */
const choiceButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition " +
  "bg-slate-100 text-slate-900 ring-1 ring-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-500 dark:hover:bg-slate-700 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

const linkButton =
  "inline-flex min-h-10 cursor-pointer items-center rounded-lg px-1.5 font-semibold text-brand-700 underline underline-offset-4 " +
  "hover:bg-slate-100 dark:text-brand-300 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

export function ConsentManager() {
  const { needsDecision, settingsOpen, choices } = useConsent();
  const [announce, setAnnounce] = useState("");

  const decided = (msg: string) => {
    setAnnounce(msg);
    // The banner (and its buttons) disappears after a choice. If focus was lost with it, put it on
    // <main> instead of leaving keyboard users at the top of <body>.
    setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body) document.querySelector<HTMLElement>("main")?.focus({ preventScroll: true });
    }, 0);
  };

  useEffect(() => {
    if (!announce) return;
    const t = setTimeout(() => setAnnounce(""), 4000);
    return () => clearTimeout(t);
  }, [announce]);

  return (
    <>
      {needsDecision && <Banner onDecided={decided} />}

      {settingsOpen && <SettingsDialog initial={needsDecision ? NO_CONSENT : choices} onDone={decided} />}

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </>
  );
}

/**
 * First layer. It comes first in the DOM (ConsentManager is the first child of <body>), so keyboard
 * and screen-reader users reach it before the page, without it stealing focus on load. It is a
 * labelled region, not a modal: the page stays usable (no cookie wall).
 */
function Banner({ onDecided }: { onDecided: (msg: string) => void }) {
  const ref = useRef<HTMLElement>(null);

  // Reserve room for the banner so it never hides the end of the page or a focused element (WCAG 2.4.11).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const body = document.body;
    const update = () => {
      const h = `${Math.ceil(el.getBoundingClientRect().height) + 16}px`;
      root.style.scrollPaddingBottom = h;
      body.style.paddingBottom = h;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.scrollPaddingBottom = "";
      body.style.paddingBottom = "";
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      className={cn(
        "fixed inset-x-2 z-40 mx-auto max-w-4xl rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-slate-300 sm:p-4",
        "dark:bg-slate-900 dark:ring-slate-600",
        // above the mobile tab bar; near the page edge on desktop
        "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4",
        "md:flex md:items-center md:gap-6",
      )}
    >
      <div className="md:flex-1">
        <h2 id="consent-title" className="text-sm font-extrabold sm:text-base">
          עוגיות ואחסון בדפדפן
        </h2>
        <p id="consent-desc" className="mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-300">
          בלי אישור נשמור בדפדפן רק מה שהאתר צריך כדי לעבוד. באישור נשמור גם את היסטוריית המבחנים שלכם ונטען סימולטורים חיצוניים שאוספים נתוני שימוש.
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm">
          <button type="button" className={linkButton} onClick={openConsentSettings} aria-haspopup="dialog">
            בחירה לפי סוג
          </button>
          <span aria-hidden className="text-slate-400">
            ·
          </span>
          <Link href="/cookies" className={linkButton}>
            מדיניות עוגיות
          </Link>
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:mt-0 md:flex md:shrink-0">
        <button type="button" className={choiceButton} onClick={() => (acceptAll(), onDecided("אישרתם את כל העוגיות."))}>
          אישור הכל
        </button>
        <button type="button" className={choiceButton} onClick={() => (rejectAll(), onDecided("דחיתם את העוגיות שאינן הכרחיות."))}>
          דחיית הכל
        </button>
      </div>
    </section>
  );
}

function SettingsDialog({ initial, onDone }: { initial: ConsentChoices; onDone: (msg: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Captured during the first render, before showModal() moves focus into the dialog.
  const [opener] = useState<Element | null>(() => (typeof document === "undefined" ? null : document.activeElement));
  const [draft, setDraft] = useState<ConsentChoices>(initial);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
      // Return focus to whatever opened the dialog, if it is still on the page.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  const finish = (fn: () => void, msg: string) => {
    fn();
    onDone(msg);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      // Esc / backdrop: close without saving (the banner comes back if no choice was made yet)
      onCancel={(e) => {
        e.preventDefault();
        closeConsentSettings();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConsentSettings();
      }}
      className={cn(
        "m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl",
        "sm:m-auto sm:max-w-lg sm:rounded-2xl",
        "backdrop:bg-slate-950/60 dark:bg-slate-900 dark:text-slate-100",
      )}
    >
      <div className="px-5 pt-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-title`} className="text-lg font-extrabold">
            הגדרות עוגיות
          </h2>
          <button
            type="button"
            onClick={closeConsentSettings}
            aria-label="סגירה בלי לשמור"
            className="-m-2 grid size-11 shrink-0 place-items-center rounded-xl text-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-slate-800"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        <p id={`${id}-desc`} className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          בחרו מה מותר לנו לשמור בדפדפן הזה. אפשר לשנות את הבחירה בכל עת דרך הקישור &quot;הגדרות עוגיות&quot; בתחתית כל עמוד.{" "}
          <Link href="/cookies" onClick={closeConsentSettings} className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
            פירוט מלא במדיניות העוגיות
          </Link>
        </p>

        <ul className="mt-4 space-y-3">
          <li className="rounded-xl p-4 ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{CATEGORY_INFO.necessary.title}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">פעילות תמיד</span>
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{CATEGORY_INFO.necessary.description}</p>
          </li>
          {OPTIONAL_CATEGORIES.map((c) => (
            <CategoryToggle key={c} category={c} checked={draft[c]} onChange={(v) => setDraft((d) => ({ ...d, [c]: v }))} />
          ))}
        </ul>

        <div className="sticky bottom-0 -mx-5 mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white shadow-[0_-8px_16px_-8px_rgb(0_0_0/0.15)] sm:shadow-none px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:grid-cols-3 sm:border-0 sm:p-0 dark:border-slate-700 dark:bg-slate-900">
          <button type="button" className={cn(choiceButton, "col-span-2 sm:col-span-1")} onClick={() => finish(() => saveConsent(draft, "custom"), "הבחירה שלכם נשמרה.")}>
            שמירת הבחירה
          </button>
          <button type="button" className={choiceButton} onClick={() => finish(acceptAll, "אישרתם את כל העוגיות.")}>
            אישור הכל
          </button>
          <button type="button" className={choiceButton} onClick={() => finish(rejectAll, "דחיתם את העוגיות שאינן הכרחיות.")}>
            דחיית הכל
          </button>
        </div>
      </div>
    </dialog>
  );
}

function CategoryToggle({ category, checked, onChange }: { category: OptionalCategory; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  const info = CATEGORY_INFO[category];
  return (
    <li className="rounded-xl p-4 ring-1 ring-slate-200 dark:ring-slate-700">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-bold">
          {info.title}
        </label>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-describedby={`${id}-desc`}
            className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex h-7 w-12 items-center rounded-full p-0.5 transition-colors",
              // off: light track with an outline (3:1 against the card, WCAG 1.4.11); on: filled brand
              "bg-slate-200 ring-2 ring-inset ring-slate-500 peer-checked:bg-brand-600 peer-checked:ring-brand-600",
              "dark:bg-slate-800 dark:ring-slate-400 dark:peer-checked:bg-brand-500 dark:peer-checked:ring-brand-500",
              // knob: starts at the inline start (right in RTL) and moves to the end when on
              "[&>span]:transition-transform peer-checked:[&>span]:-translate-x-5",
            )}
          >
            <span className="size-6 rounded-full bg-white shadow ring-1 ring-slate-400" />
          </span>
          <span aria-hidden className="ms-2 w-9 text-sm font-bold text-slate-700 dark:text-slate-300">
            {checked ? "פעיל" : "כבוי"}
          </span>
        </span>
      </div>
      <p id={`${id}-desc`} className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        {info.description}
      </p>
    </li>
  );
}

/** "הגדרות עוגיות" link: reopens the settings dialog from anywhere (footer, /cookies). */
export function CookieSettingsButton({ className, children = "הגדרות עוגיות" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={openConsentSettings} aria-haspopup="dialog" className={className}>
      {children}
    </button>
  );
}
