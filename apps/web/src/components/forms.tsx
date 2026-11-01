"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button, IconCheckCircle, inputClass, labelClass } from "@electricademy/ui";
import { createPost, createThread, joinWaitlist, toggleLessonComplete, type FormState } from "@/lib/actions";
import { COMMUNITY_TAGS } from "@/lib/labels";

function FormError({ state }: { state: FormState }) {
  return state?.error ? (
    <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-400">
      {state.error}
    </p>
  ) : null;
}

export function NewThreadForm({ lessonPath }: { lessonPath?: string }) {
  const [state, action, pending] = useActionState(createThread, undefined);
  return (
    <form action={action} className="space-y-4">
      {lessonPath && <input type="hidden" name="lessonPath" value={lessonPath} />}
      <label className="block">
        <span className={labelClass}>כותרת</span>
        <input name="title" required minLength={5} maxLength={200} className={inputClass} />
      </label>
      <label className="block">
        <span className={labelClass}>נושא</span>
        <select name="tag" className={inputClass} defaultValue="general">
          {Object.entries(COMMUNITY_TAGS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>תוכן</span>
        <textarea name="body" required minLength={10} rows={7} className={inputClass} />
      </label>
      <FormError state={state} />
      <Button disabled={pending} size="lg">
        {pending ? "מפרסם…" : "פרסום הדיון"}
      </Button>
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
      <Button disabled={pending}>{pending ? "שולח…" : "שליחת תגובה"}</Button>
    </form>
  );
}

export function WaitlistForm({ product }: { product: "license-exam" | "blue-grid" }) {
  const [state, action, pending] = useActionState(joinWaitlist, undefined);
  if (state?.ok) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
        <IconCheckCircle className="size-5 shrink-0 text-emerald-600" />
        תודה! נעדכן אתכם ברגע שנפתח.
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
      aria-pressed={completed}
      title={completed ? "לחיצה נוספת תבטל את הסימון" : undefined}
      onClick={() => startTransition(() => toggleLessonComplete(lessonPath, !completed))}
      className={completed ? "text-emerald-800 ring-emerald-300 dark:text-emerald-200 dark:ring-emerald-800" : undefined}
    >
      <IconCheckCircle className="size-5" />
      {completed ? "השיעור הושלם" : "סימון השיעור כהושלם"}
    </Button>
  );
}
