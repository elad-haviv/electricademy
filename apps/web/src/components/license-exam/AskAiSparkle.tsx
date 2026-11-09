"use client";

import { useId, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@electricademy/ui";

/**
 * The ✨ next to an answer that opens "התייעצות עם AI". The tooltip shows on hover and keyboard focus, is tied to
 * the button with aria-describedby, and closes with Escape (WCAG 1.4.13). On touch screens there is no hover, so a
 * tap simply opens the chat; the button's own name says what it does.
 */
export function AskAiSparkle({ onClick, active }: { onClick: () => void; active?: boolean }) {
  const tipId = useId();
  const [tip, setTip] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <button
        type="button"
        onClick={() => {
          setTip(false);
          onClick();
        }}
        onFocus={(e) => setTip(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setTip(false)}
        onKeyDown={(e) => e.key === "Escape" && setTip(false)}
        aria-label="התייעצות עם AI על התשובה"
        aria-describedby={tipId}
        aria-expanded={active}
        className={cn(
          "grid size-11 place-items-center rounded-full text-violet-700 transition hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950/60",
          active && "bg-violet-100 dark:bg-violet-950/60",
        )}
      >
        <Sparkles className="size-5" aria-hidden />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full start-1/2 z-20 mb-1 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg transition-opacity rtl:translate-x-1/2 dark:bg-white dark:text-slate-900",
          tip ? "opacity-100" : "opacity-0",
        )}
      >
        אפשר להתייעץ עם AI על התשובה
      </span>
    </span>
  );
}
