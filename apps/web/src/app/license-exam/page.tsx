import Link from "next/link";
import type { Metadata } from "next";
import { Badge, buttonClass, Card } from "@electricademy/ui";
import { EXAM_LEVELS, EXAM_TOPICS, type ExamLevel, type ExamTopic } from "@electricademy/content";
import { PageBanner } from "@/components/PageBanner";
import { LawCallout } from "@/components/law/LawCallout";
import { bankSummary, EXAM_SIZE } from "@/lib/licenseExam";

export const metadata: Metadata = {
  title: "סימולטור בחינות רישוי חשמלאים",
  description: "סימולציית בחינה, תרגול לפי נושא ועיון בכל שאלות המאגר הרשמי לבחינות הרישוי בחשמל: טכנאים, הנדסאים ומהנדסים.",
};

const OFFICIAL_PAGE = "https://www.gov.il/he/pages/electricity-questions";

const MODES = [
  {
    href: "/license-exam/exam",
    icon: "⏱️",
    title: "סימולציית בחינה",
    text: `${EXAM_SIZE} שאלות אקראיות לפי סוג הרישיון, עם שעון, סימון שאלות לבדיקה וסיכום מפורט בסוף.`,
    cta: "להתחיל בחינה",
  },
  {
    href: "/license-exam/practice",
    icon: "🎯",
    title: "תרגול לפי נושא",
    text: "בוחרים נושאים ומתרגלים שאלה אחר שאלה, או חוזרים על השאלות ששמרתם.",
    cta: "לתרגול",
  },
  {
    href: "/license-exam/browse",
    icon: "🗂️",
    title: "עיון במאגר",
    text: "כל השאלות במאגר, עם חיפוש וסינון לפי נושא ורישיון.",
    cta: "לעיון במאגר",
  },
];

export default function LicenseExamPage() {
  const { meta, perLevel, perTopic, keyed } = bankSummary();
  const published = meta.published ? new Date(meta.published).toLocaleDateString("he-IL", { month: "long", year: "numeric" }) : null;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageBanner
        title="סימולטור בחינות רישוי חשמלאים"
        subtitle="מתכוננים לבחינת הרישוי על השאלות של המאגר הרשמי: חשמלאי טכנאי, הנדסאי ומהנדס."
        image="/images/license-exam.webp"
        eyebrow={
          <span className="flex flex-wrap gap-2">
            <Badge tone="pro">בטא</Badge>
            {meta.version && <Badge tone="brand">מאגר גרסה {meta.version}{published && ` · ${published}`}</Badge>}
          </span>
        }
      >
        <Link href="/license-exam/exam" className={buttonClass("primary", "mt-3 self-start bg-spark-400 text-slate-900 hover:bg-spark-300")}>
          להתחיל בחינה
        </Link>
      </PageBanner>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((m) => (
          <Card key={m.href} className="flex flex-col">
            <p className="text-2xl" aria-hidden>
              {m.icon}
            </p>
            <h2 className="mt-2 font-bold">{m.title}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{m.text}</p>
            <Link href={m.href} className={buttonClass("secondary", "mt-4 self-start")}>
              {m.cta}
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-bold">כמה שאלות בכל רישיון</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(EXAM_LEVELS) as ExamLevel[]).map((l) => (
            <div key={l} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <dt className="text-sm text-slate-600 dark:text-slate-400">{EXAM_LEVELS[l].title}</dt>
              <dd className="text-2xl font-extrabold tabular-nums">{perLevel[l].toLocaleString("he-IL")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          המאגר מסמן אילו שאלות מיועדות למהנדסים בלבד ואילו למהנדסים והנדסאים בלבד; כל השאר יכולות להופיע בכל הבחינות.
        </p>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">נושאים</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EXAM_TOPICS) as ExamTopic[])
            .filter((t) => perTopic[t] > 0)
            .sort((a, b) => perTopic[b] - perTopic[a])
            .map((t) => (
              <Link
                key={t}
                href={`/license-exam/browse?topic=${t}`}
                className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
              >
                {EXAM_TOPICS[t].title} <span className="text-slate-500 tabular-nums">{perTopic[t]}</span>
              </Link>
            ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">הסיווג לנושאים נעשה אוטומטית לפי תוכן השאלה, ולא מופיע במאגר הרשמי.</p>
      </section>

      <Card className="space-y-2 text-sm">
        <h2 className="text-lg font-bold">על המאגר</h2>
        <p>
          השאלות לקוחות מ&quot;מאגר שאלות לבחינות רישוי בחשמל לטכנאים, הנדסאים ומהנדסים&quot; של משרד העבודה, כפי שפורסם ב
          <a href={OFFICIAL_PAGE} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline dark:text-brand-300">
            אתר gov.il
          </a>
          . לפי המשרד, השאלות בבחינה מבוססות על המאגר, אך הניסוח, המספרים והנתונים בבחינה עשויים להיות שונים.
        </p>
        <p>
          המאגר הרשמי מתפרסם ללא תשובות.{" "}
          {keyed > 0
            ? `ל־${keyed} שאלות הוספנו תשובה שבדקנו מול התקנות; שאר השאלות מוצגות ללא תשובה.`
            : "אנחנו מוסיפים תשובות מאומתות בהדרגה; עד אז הסימולטור מציג את התשובות שבחרתם לבדיקה עצמית."}
        </p>
      </Card>

      <LawCallout title="תשובות נמצאות בתקנות" />
    </div>
  );
}
