import Link from "next/link";
import { cn } from "@electricademy/ui";
import { CookieSettingsButton } from "./ConsentManager";

const item = "inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand-500";

/**
 * Accessibility statement, privacy and cookie links + the "הגדרות עוגיות" button that reopens the consent dialog.
 * SiteFooter shows them on every page: in its slim mobile row and in the desktop footer.
 */
export function LegalLinks({ variant }: { variant: "mobile" | "footer" }) {
  return (
    <nav
      aria-label="נגישות ופרטיות"
      data-site-chrome
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-1 text-xs font-semibold",
        variant === "mobile"
          ? "border-t border-slate-200 px-4 pt-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-slate-600 md:hidden dark:border-slate-800 dark:text-slate-400"
          : "text-slate-400",
      )}
    >
      <Link href="/accessibility" className={item}>
        הצהרת נגישות
      </Link>
      <span aria-hidden>·</span>
      <Link href="/privacy" className={item}>
        מדיניות פרטיות
      </Link>
      <span aria-hidden>·</span>
      <Link href="/cookies" className={item}>
        מדיניות עוגיות
      </Link>
      <span aria-hidden>·</span>
      <CookieSettingsButton className={cn(item, "cursor-pointer underline")} />
    </nav>
  );
}
