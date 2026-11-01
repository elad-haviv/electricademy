"use client";

import { Button, IconZap } from "@electricademy/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-spark-300/40 text-slate-900 dark:text-spark-300">
        <IconZap className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold">קפץ לנו מפסק</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">משהו השתבש. נסו שוב בעוד רגע.</p>
      <Button className="mt-8" onClick={reset}>
        לנסות שוב
      </Button>
    </div>
  );
}
