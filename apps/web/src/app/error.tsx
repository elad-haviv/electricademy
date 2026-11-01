"use client";

import { Button } from "@electricademy/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl" aria-hidden>
        ⚡
      </p>
      <h1 className="mt-4 text-3xl font-extrabold">קפץ לנו מפסק</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">משהו השתבש. נסו שוב בעוד רגע.</p>
      <Button className="mt-6" onClick={reset}>
        לנסות שוב
      </Button>
    </div>
  );
}
