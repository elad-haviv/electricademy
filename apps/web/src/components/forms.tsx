"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button } from "@electricademy/ui";
import { createPost, createThread, joinWaitlist, toggleLessonComplete, type FormState } from "@/lib/actions";
import { COMMUNITY_TAGS } from "@/lib/labels";

const inputClass =
  "w-full rounded-xl bg-white px-3 py-2 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:ring-slate-700";

function FormError({ state }: { state: FormState }) {
  return state?.error ? (
    <p role="alert" className="text-sm font-medium text-rose-600">
      {state.error}
    </p>
  ) : null;
}

export function NewThreadForm({ lessonPath }: { lessonPath?: string }) {
  const [state, action, pending] = useActionState(createThread, undefined);
  return (
    <form action={action} className="space-y-4">
      {lessonPath && <input type="hidden" name="lessonPath" value={lessonPath} />}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">כותרת</span>
        <input name="title" required minLength={5} maxLength={200} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">נושא</span>
        <select name="tag" className={inputClass} defaultValue="general">
          {Object.entries(COMMUNITY_TAGS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">תוכן</span>
        <textarea name="body" required minLength={10} rows={7} className={inputClass} />
      </label>
      <FormError state={state} />
      <Button disabled={pending}>{pending ? "מפרסם…" : "פרסום"}</Button>
    </form>
  );
}

export function ReplyForm({ threadId }: { threadId: number }) {
  const [state, action, pending] = useActionState(createPost, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      <textarea name="body" required minLength={2} rows={4} className={inputClass} placeholder="כתבו תגובה…" aria-label="תגובה" />
      <FormError state={state} />
      <Button disabled={pending}>{pending ? "שולח…" : "הגבה"}</Button>
    </form>
  );
}

export function WaitlistForm({ product }: { product: "license-exam" | "blue-grid" }) {
  const [state, action, pending] = useActionState(joinWaitlist, undefined);
  if (state?.ok) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 p-4 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        תודה! נעדכן אתכם ברגע שנפתח. ⚡
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="product" value={product} />
      <input type="email" name="email" required placeholder="האימייל שלכם" dir="ltr" className={inputClass} aria-label="אימייל" />
      <Button disabled={pending} className="shrink-0">
        {pending ? "שולח…" : "עדכנו אותי"}
      </Button>
      <FormError state={state} />
    </form>
  );
}

export function LessonCompleteButton({ lessonPath, completed }: { lessonPath: string; completed: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={completed ? "secondary" : "primary"}
      disabled={pending}
      onClick={() => startTransition(() => toggleLessonComplete(lessonPath, !completed))}
    >
      {completed ? "✓ השיעור הושלם (לביטול)" : "סימון השיעור כהושלם"}
    </Button>
  );
}
