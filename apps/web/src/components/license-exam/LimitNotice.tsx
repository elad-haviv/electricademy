import { cn } from "@electricademy/ui";

export interface Notice {
  message: string;
  /** Set when a content limit refused the request (lib/contentGuard.ts); plain errors have none. */
  retry?: "minute" | "day";
}

const TITLES = { minute: "רגע קצר", day: "להיום סיימנו" } as const;

/**
 * A refused request, said kindly: a content limit (calm, informative, no blame) or an ordinary error.
 * Polite live region, so a screen reader hears it without losing its place.
 */
export function LimitNotice({ notice, className }: { notice: Notice | null; className?: string }) {
  if (!notice) return null;
  if (!notice.retry) {
    return (
      <p role="alert" className={cn("text-sm text-rose-600 dark:text-rose-400", className)}>
        {notice.message}
      </p>
    );
  }
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900",
        className,
      )}
    >
      <span aria-hidden className="text-lg leading-none">
        {notice.retry === "minute" ? "⏳" : "🌙"}
      </span>
      <div className="space-y-1">
        <p className="font-bold">{TITLES[notice.retry]}</p>
        <p className="leading-relaxed">{notice.message}</p>
      </div>
    </div>
  );
}
