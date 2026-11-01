/**
 * The learning catalog: tracks → modules → lessons.
 * Lesson bodies live in /content/lessons/<track>/<module>/<lesson>.mdx.
 * A lesson listed here without an MDX file is shown as "coming soon".
 */
export type Tier = "free" | "pro";

export interface LessonRef {
  slug: string;
  title: string;
}

export interface Module {
  slug: string;
  title: string;
  description: string;
  lessons: LessonRef[];
}

export interface Track {
  slug: string;
  title: string;
  audience: string;
  description: string;
  icon: string;
  /** 3D cover render under apps/web/public. */
  image: string;
  tier: Tier;
  modules: Module[];
}

export const TRACKS: Track[] = [
  {
    slug: "basics",
    title: "יסודות החשמל",
    audience: "מתחילים מאפס",
    description: "מתח, זרם, התנגדות והספק. כל מה שצריך כדי להתחיל, בלי ידע קודם.",
    icon: "⚡",
    image: "/images/tracks/basics.webp",
    tier: "free",
    modules: [
      {
        slug: "circuits",
        title: "מעגלים חשמליים",
        description: "חוק אוהם, הספק ומפל מתח: אבני היסוד של כל מתקן חשמלי.",
        lessons: [
          { slug: "ohms-law", title: "חוק אוהם" },
          { slug: "power", title: "הספק ואנרגיה" },
          { slug: "voltage-drop", title: "מפל מתח בכבלים" },
          { slug: "series-parallel", title: "חיבור טורי ומקבילי" },
        ],
      },
      {
        slug: "ac",
        title: "זרם חילופין",
        description: "גל סינוס, ערך אפקטיבי, מקדם הספק ומערכת תלת־פאזית.",
        lessons: [
          { slug: "sine-wave", title: "גל סינוס וערך אפקטיבי" },
          { slug: "power-factor", title: "מקדם הספק" },
          { slug: "three-phase", title: "מערכת תלת־פאזית" },
        ],
      },
    ],
  },
  {
    slug: "bagrut",
    title: "בגרות בחשמל",
    audience: "תלמידי מגמת חשמל",
    description: "הכנה לבחינות הבגרות של משרד החינוך במגמת הנדסת חשמל.",
    icon: "🎓",
    image: "/images/tracks/bagrut.webp",
    tier: "free",
    modules: [
      {
        slug: "dc-circuits",
        title: "מעגלי זרם ישר",
        description: "קירכהוף, תבנין ונורטון, משפט הסופרפוזיציה.",
        lessons: [
          { slug: "kirchhoff", title: "חוקי קירכהוף" },
          { slug: "thevenin", title: "משפט תבנין" },
        ],
      },
    ],
  },
  {
    slug: "technician",
    title: "טכנאי והנדסאי חשמל",
    audience: "סטודנטים במכללות (מה\"ט)",
    description: "מכונות חשמל, מערכות הספק, אלקטרוניקת הספק ומתקנים, לפי תכניות מה\"ט.",
    icon: "🛠️",
    image: "/images/tracks/technician.webp",
    tier: "pro",
    modules: [
      {
        slug: "machines",
        title: "מכונות חשמל",
        description: "שנאים, מנועי השראה ומכונות סינכרוניות.",
        lessons: [
          { slug: "transformers", title: "שנאים" },
          { slug: "induction-motor", title: "מנוע השראה" },
        ],
      },
    ],
  },
  {
    slug: "academic",
    title: "הנדסת חשמל (תואר)",
    audience: "סטודנטים לתואר ראשון",
    description: "ניתוח מערכות הספק, יציבות, זרמי קצר ובקרה, ברמה האקדמית.",
    icon: "📐",
    image: "/images/tracks/academic.webp",
    tier: "pro",
    modules: [
      {
        slug: "power-systems",
        title: "ניתוח מערכות הספק",
        description: "Per-unit, זרימת עומסים וחישובי קצר.",
        lessons: [
          { slug: "per-unit", title: "שיטת היחידה (Per-Unit)" },
          { slug: "short-circuit", title: "חישובי זרם קצר" },
        ],
      },
    ],
  },
  {
    slug: "licensing",
    title: "בחינות רישוי חשמלאים",
    audience: "חשמלאי מעשי, מוסמך, הנדסאי ומהנדס",
    description: "תקנות החשמל, הגנות, הארקות ומתקנים, לקראת בחינות הרישוי.",
    icon: "📜",
    image: "/images/tracks/licensing.webp",
    tier: "free",
    modules: [
      {
        slug: "protection",
        title: "הגנה בפני חשמול",
        description: "הארקת הגנה, איפוס, מפסק מגן ושיטות הגנה נוספות.",
        lessons: [
          { slug: "protective-earthing", title: "הארקת הגנה" },
          { slug: "rcd", title: "מפסק מגן (פחת)" },
        ],
      },
    ],
  },
  {
    slug: "professionals",
    title: "אנשי מקצוע",
    audience: "חשמלאים בשטח, מתכננים ומהנדסים",
    description: "חישובים, תקנות, חידושים ונישות: מתח גבוה, גנרטורים, אנרגיה מתחדשת ועוד.",
    icon: "🏗️",
    image: "/images/tracks/professionals.webp",
    tier: "pro",
    modules: [
      {
        slug: "design",
        title: "תכנון מתקנים",
        description: "בחירת כבלים, סלקטיביות, תיאום הגנות ומאזן הספקים.",
        lessons: [
          { slug: "cable-selection", title: "בחירת כבלים בפועל" },
          { slug: "selectivity", title: "סלקטיביות ותיאום הגנות" },
        ],
      },
    ],
  },
];

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

export function getModule(trackSlug: string, moduleSlug: string): { track: Track; module: Module } | undefined {
  const track = getTrack(trackSlug);
  const module = track?.modules.find((m) => m.slug === moduleSlug);
  return track && module ? { track, module } : undefined;
}

export function lessonPath(track: string, module: string, lesson: string): string {
  return `${track}/${module}/${lesson}`;
}

export function allLessonPaths(): string[] {
  return TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => lessonPath(t.slug, m.slug, l.slug))));
}
