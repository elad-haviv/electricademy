/**
 * The Electricity Law and its regulations, as published in "ספר החוקים הפתוח" on Hebrew Wikisource.
 * Sources live in /content/legislation/<slug>.txt (Open Law Book markup) and are refreshed with
 * `pnpm --filter @electricademy/content legislation:import`. The binding text is the official one
 * published in Reshumot; see OFFICIAL_REPOSITORY_URL.
 */

export type LegislationCategory = "law" | "protection" | "wiring" | "installations" | "special" | "work";

export const LEGISLATION_CATEGORIES: Record<LegislationCategory, { title: string; description: string }> = {
  law: { title: "החוק", description: "החוק הראשי, שמכוחו הותקנו כל התקנות." },
  protection: { title: "הארקות והגנה בפני חישמול", description: "שיטות הגנה, הארקות יסוד ומפסקי מגן." },
  wiring: { title: "מוליכים, כבלים ומובלים", description: "בחירת מוליכים, העמסה והגנה, התקנת כבלים ומובלים." },
  installations: { title: "לוחות, מעגלים וגנרטורים", description: "לוחות חשמל, מעגלים סופיים, גנרטורים, אל־פסק ורשתות עיליות." },
  special: { title: "מתקנים מיוחדים", description: "אתרים רפואיים, בריכות, אתרי בנייה, חקלאות, רמזורים ובניינים רבי קומות." },
  work: { title: "רישוי ועבודה", description: "רישיונות לעבודות חשמל, עבודה במתקן חי וועדת עררים." },
};

export interface LegislationEntry {
  /** URL segment under /law. */
  slug: string;
  /** Page title on he.wikisource.org (the "מקור:" page holds the markup). */
  wikisourceTitle: string;
  category: LegislationCategory;
  /** One-line summary for the index (ours, not part of the legal text). */
  summary: string;
}

export const LEGISLATION: LegislationEntry[] = [
  { slug: "electricity-law", wikisourceTitle: "חוק החשמל", category: "law", summary: "הגדרות, מועצת מקצועות החשמל, רישיונות לעבודות חשמל והסמכות להתקין תקנות." },

  { slug: "earthing-and-shock-protection", wikisourceTitle: "תקנות החשמל (הארקות ואמצעי הגנה בפני חישמול במתח עד 1000 וולט)", category: "protection", summary: "סוגי ההגנות, אלקטרודות ומוליכי הארקה, איפוס (TN), הארקת הגנה (TT), זינה צפה (IT), הפרד מגן, מתח נמוך מאוד, מפסק מגן ובידוד מגן." },
  { slug: "foundation-earthing", wikisourceTitle: "תקנות החשמל (הארקות יסוד)", category: "protection", summary: "הארקת יסודות במבנים: טבעת גישור, מוליך הארקה ופס השוואת פוטנציאלים." },

  { slug: "conductor-loading-and-protection", wikisourceTitle: "תקנות החשמל (העמסה והגנה על מוליכים מבודדים וכבלים במתח נמוך)", category: "wiring", summary: "מבטחים להגנה מפני העמסת יתר ומפני קצר, מיקומם, טבלאות זרם מתמיד מרבי ושיטות התקנה." },
  { slug: "conductors", wikisourceTitle: "תקנות החשמל (התקנת מוליכים)", category: "wiring", summary: "מבנה מוליך מתכתי, התקנה סמויה, חשיפה וגלויה, ותיבות ואבזרים." },
  { slug: "lv-cables", wikisourceTitle: "תקנות החשמל (התקנת כבלים במתח שאינו עולה על מתח נמוך)", category: "wiring", summary: "עיבוד קצות כבל, התקנה גלויה, חשיפה וסמויה, כבלים באדמה וכבלים עיליים." },
  { slug: "hv-cables", wikisourceTitle: "תקנות החשמל (התקנת כבלי חשמל במתח גבוה)", category: "wiring", summary: "תנאי התקנה ומבנה הכבל, עיבוד קצוות, התקנה גלויה, במובל ובאדמה." },
  { slug: "conduits-and-wiring", wikisourceTitle: "תקנות החשמל (התקנת מובלים והתיול שבהם במתח שאינו עולה על מתח נמוך)", category: "wiring", summary: "מובלים, צינורות פלסטיק ומתכת, צינורות באדמה ותעלות." },

  { slug: "switchboards", wikisourceTitle: "תקנות החשמל (התקנת לוחות במתח עד 1000 וולט)", category: "installations", summary: "דרישות כלליות, מרווחים ומעברים, ציוד המותקן בלוח ולוחות במתקנים ביתיים." },
  { slug: "final-circuits", wikisourceTitle: "תקנות החשמל (מעגלים סופיים הניזונים במתח עד 1000 וולט)", category: "installations", summary: "מפסקים ובתי תקע, מנורות, מכשירי חשמל, קבלים לשיפור מקדם ההספק ודודי שמש." },
  { slug: "lv-generators", wikisourceTitle: "תקנות החשמל (התקנת גנרטורים למתח נמוך)", category: "installations", summary: "תנאים כלליים וסביבתיים להתקנת גנרטור, רישום, בדיקה והיתר להקמת ערכת גנרטור." },
  { slug: "ups-systems", wikisourceTitle: "תקנות החשמל (התקנת מערכות אל-פסק סטטיות במתח נמוך)", category: "installations", summary: "אמצעי בטיחות בהתקנת מערכות אל־פסק (UPS) סטטיות." },
  { slug: "lv-overhead-networks", wikisourceTitle: "תקנות החשמל (התקנת רשתות חשמל עיליות במתח עד 1000 וולט)", category: "installations", summary: "מוליכים ואבזרי רשת, הצטלבות והתקרבות לרשתות, לקווי בזק, לעצים ולמבנים, והארקות." },

  { slug: "medical-sites", wikisourceTitle: "תקנות החשמל (מיתקני חשמל באתרים רפואיים במתח שאינו עולה על מתח נמוך)", category: "special", summary: "זינה, הגנה בפני חישמול, הארקה והשוואת פוטנציאלים, זינות חלופיות ובדיקות." },
  { slug: "swimming-pools", wikisourceTitle: "תקנות החשמל (מיתקני חשמל בבריכה במתח שאינו עולה על מתח נמוך)", category: "special", summary: "מניעת חישמול, מובלים וציוד במתקן החשמלי של בריכה." },
  { slug: "water-reservoirs", wikisourceTitle: "תקנות החשמל (התקנת מיתקן חשמלי בסביבת מאגר מים במתח שאינו עולה על מתח נמוך)", category: "special", summary: "התקנת ציוד, הארקות והגנה בפני חישמול בסביבת מאגר מים." },
  { slug: "construction-sites", wikisourceTitle: "תקנות החשמל (מיתקן חשמלי ארעי באתר בניה במתח שאינו עולה על מתח נמוך)", category: "special", summary: "מתקן חשמלי ארעי באתר בנייה ובדיקות תקופתיות." },
  { slug: "high-rise-public-installations", wikisourceTitle: "תקנות החשמל (מיתקן חשמלי ציבורי בבנין רב קומות)", category: "special", summary: "דרישות כלליות, חדר חשמל ומתקן ציבורי בבניין רב קומות." },
  { slug: "agricultural-premises", wikisourceTitle: "תקנות החשמל (מיתקני חשמל בחצרים חקלאיים במתח עד 1000 וולט)", category: "special", summary: "הגנה בפני חישמול, התקנת מוליכים, מיתוג והגנה וציוד חשמלי בחצרים חקלאיים." },
  { slug: "traffic-signals", wikisourceTitle: "תקנות החשמל (מיתקני חשמל לתמרורי הוריה (רמזורים) במתח שאינו עולה על מתח נמוך)", category: "special", summary: "דרישות כלליות והתקנת מתקני חשמל לרמזורים." },

  { slug: "licenses", wikisourceTitle: "תקנות החשמל (רשיונות)", category: "work", summary: "סוגי הרישיונות, מחשמלאי־עוזר ועד חשמלאי־מהנדס וחשמלאי־בודק, ותנאי הכשירות לכל אחד." },
  { slug: "live-work", wikisourceTitle: "תקנות החשמל (עבודה במיתקן חי או בקרבתו)", category: "work", summary: "עבודה ומדידה במתקן חי ובקרבתו, תחומי עבודה לפי מתח וציוד מגן." },
  { slug: "appeals-committee", wikisourceTitle: "תקנות החשמל (סדרי הדין של ועדת עררים)", category: "work", summary: "סדרי הדין בוועדת העררים." },
];

export const OFFICIAL_REPOSITORY_URL = "https://www.gov.il/he/pages/mmok_takanot_maagar_2025";

export function wikisourceUrl(title: string): string {
  return `https://he.wikisource.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

export function getLegislationEntry(slug: string): LegislationEntry | undefined {
  return LEGISLATION.find((e) => e.slug === slug);
}
