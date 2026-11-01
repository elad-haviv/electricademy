import Link from "next/link";
import { buttonClass, IconZap } from "@electricademy/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-spark-300/40 text-slate-900 dark:text-spark-300">
        <IconZap className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold">המעגל פתוח, הדף לא נמצא</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">ייתכן שהקישור שגוי או שהדף הועבר.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonClass("primary")}>
          לדף הבית
        </Link>
        <Link href="/tracks" className={buttonClass("secondary")}>
          למסלולי הלימוד
        </Link>
      </div>
    </div>
  );
}
