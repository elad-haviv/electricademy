"use client";

import { useState, useTransition } from "react";
import type { ClientKey, ClientQuestion } from "@/lib/licenseExam";
import { revealAnswer } from "@/lib/licenseExamActions";
import { LimitNotice, type Notice } from "./LimitNotice";
import { KeyNote, OptionList } from "./Question";

/**
 * "Show the answer" for one bank question (browse, question page). The answer is fetched only when asked
 * for, through the rate-limited revealAnswer action; once shown it can be folded away and back for free.
 */
export function RevealAnswer({ n, q }: { n: number; q?: ClientQuestion }) {
  const [key, setKey] = useState<ClientKey | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    if (key !== undefined) {
      setOpen((o) => !o);
      return;
    }
    setNotice(null);
    startTransition(async () => {
      try {
        const r = await revealAnswer(n);
        if (r.ok) {
          setKey(r.key);
          setOpen(true);
        } else setNotice(r);
      } catch {
        setNotice({ message: "לא הצלחנו להביא את התשובה. בדקו את החיבור ונסו שוב." });
      }
    });
  };

  const label = pending ? "טוענים את התשובה…" : open ? "הסתרת התשובה" : "הצגת התשובה";
  const shown = open && key ? key.answer : null;
  return (
    <div className="space-y-2">
      {q && <OptionList q={q} stateOf={(c) => (shown === null ? "idle" : c === shown ? "correct" : "idle")} />}
      {notice?.retry !== "day" && (
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-expanded={open}
          aria-controls={`answer-${n}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-brand-700 hover:underline disabled:opacity-70 dark:text-brand-300"
        >
          <span aria-hidden className={open ? "inline-block rotate-180 transition" : "inline-block transition"}>
            ▾
          </span>
          {label}
        </button>
      )}
      <LimitNotice notice={notice} />
      <div id={`answer-${n}`} hidden={!open}>
        {key !== undefined && <KeyNote k={key} />}
      </div>
    </div>
  );
}
