import Link from "next/link";
import { buttonClass, Card } from "@electricademy/ui";

export function Paywall({ title = "תוכן למנויי Pro", loggedIn }: { title?: string; loggedIn: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="text-4xl" aria-hidden>
        🔒
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-md text-slate-600 dark:text-slate-400">
        התוכן הזה זמין במנוי Pro, יחד עם מבחני תרגול, סימולטורים מתקדמים וכלי חישוב מקצועיים.
      </p>
      <div className="flex gap-2">
        <Link href="/pricing" className={buttonClass("primary")}>
          לפרטים על Pro
        </Link>
        {!loggedIn && (
          <Link href="/login" className={buttonClass("secondary")}>
            התחברות
          </Link>
        )}
      </div>
    </Card>
  );
}
