import type { Metadata } from "next";
import { LEGISLATION, LEGISLATION_CATEGORIES, OFFICIAL_REPOSITORY_URL, type LegislationCategory } from "@electricademy/content";
import { PageBanner } from "@/components/PageBanner";
import { LawIndex, type LawIndexGroup } from "@/components/law/LawIndex";
import { getLawDoc } from "@/lib/law";

export const metadata: Metadata = {
  title: "חוק החשמל ותקנותיו",
  description: "חוק החשמל, התשי״ד-1954, ותקנות החשמל בנוסח משולב לקריאה: הארקות, מוליכים וכבלים, לוחות, מעגלים סופיים, מתקנים מיוחדים ורישוי.",
};

/** "תקנות החשמל (הארקות יסוד), התשמ"א-1981" → short title without the "(...)" wrapper, and the year. */
function splitTitle(title: string): { title: string; year: string | null } {
  const year = /(\d{4})\s*$/.exec(title)?.[1] ?? null;
  const short = title.replace(/^תקנות החשמל\s*\((.+)\)\s*,.*$/, "$1").replace(/,\s*[^,]*\d{4}\s*$/, "");
  return { title: short, year };
}

export default function LawIndexPage() {
  const groups: LawIndexGroup[] = (Object.keys(LEGISLATION_CATEGORIES) as LegislationCategory[]).map((id) => ({
    id,
    ...LEGISLATION_CATEGORIES[id],
    items: LEGISLATION.filter((e) => e.category === id).map((e) => {
      const full = getLawDoc(e.slug)?.title ?? e.wikisourceTitle;
      return { slug: e.slug, ...splitTitle(full), summary: e.summary };
    }),
  }));

  return (
    <div className="space-y-8">
      <PageBanner
        title="חוק החשמל ותקנותיו"
        subtitle="החוק ו־22 תקנות החשמל בנוסח משולב, עם תוכן עניינים וקישור ישיר לכל סעיף ותקנה."
        image="/images/license-exam.webp"
        eyebrow={<span className="text-sm font-bold text-spark-300">ספרייה מקצועית</span>}
      />
      <LawIndex groups={groups} />
      <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-bold">על הנוסח</p>
        <p className="mt-1">
          הנוסחים כאן הם נוסחים משולבים לנוחות הקריאה, מתוך{" "}
          <a href="https://he.wikisource.org/wiki/ספר_החוקים_הפתוח" target="_blank" rel="noopener" className="underline">
            ספר החוקים הפתוח בוויקיטקסט
          </a>{" "}
          (עריכה ועיצוב ברישיון CC BY-SA 4.0). הנוסח המחייב הוא הנוסח הרשמי שפורסם ברשומות. לנוסחים הרשמיים ראו את{" "}
          <a href={OFFICIAL_REPOSITORY_URL} target="_blank" rel="noopener" className="underline">
            מאגר התקנות הממשלתי ב־gov.il
          </a>
          .
        </p>
      </aside>
    </div>
  );
}
