"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@electricademy/ui";
import { addExamComment } from "@/lib/examDiscussionActions";

const inputClass =
  "w-full rounded-xl bg-white px-3 py-2 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:ring-slate-700";

export function CommentForm({ n, parentId, onDone }: { n: number; parentId?: number; onDone?: () => void }) {
  const [state, action, pending] = useActionState(addExamComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="n" value={n} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        required
        minLength={2}
        maxLength={5000}
        rows={parentId ? 3 : 4}
        className={inputClass}
        placeholder={parentId ? "כתבו תשובה…" : "שאלה, הסבר, מקור בתקנות או ערעור על התשובה…"}
        aria-label={parentId ? "תשובה לתגובה" : "תגובה"}
      />
      {!parentId && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>לדעתי התשובה הנכונה היא</span>
          <select name="suggestedAnswer" defaultValue="" className="rounded-lg bg-white px-2 py-1 ring-1 ring-slate-300 dark:bg-slate-950 dark:ring-slate-700">
            <option value="">(לא לציין)</option>
            {[1, 2, 3, 4].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      )}
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          {state.error}
        </p>
      )}
      <Button disabled={pending}>{pending ? "שולח…" : parentId ? "שליחת תשובה" : "פרסום"}</Button>
    </form>
  );
}

export function ReplyToggle({ n, parentId }: { n: number; parentId: number }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="mt-2">
      <CommentForm n={n} parentId={parentId} onDone={() => setOpen(false)} />
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
      תשובה
    </button>
  );
}
