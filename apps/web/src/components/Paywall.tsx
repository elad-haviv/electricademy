import Link from "next/link";
import { buttonClass, Card, IconCheck, IconLock } from "@electricademy/ui";

const PERKS = ["כל מסלולי הלימוד", "מבחני תרגול ובנק שאלות", "סימולטורים ומחשבונים מקצועיים"];

export function Paywall({ title = "תוכן למנויי Pro", loggedIn }: { title?: string; loggedIn: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-spark-300/40 text-slate-900 dark:bg-spark-400/20 dark:text-spark-300">
        <IconLock className="size-7" />
      </span>
      <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center justify-center gap-2">
            <IconCheck className="size-4 text-emerald-600" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href="/pricing" className={buttonClass("primary")}>
          לפרטים על Pro
        </Link>
        {!loggedIn && (
          <Link href="/login" className={buttonClass("secondary")}>
            כבר מנויים? התחברות
          </Link>
        )}
      </div>
    </Card>
  );
}
