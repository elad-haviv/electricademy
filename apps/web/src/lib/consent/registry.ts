/**
 * The single list of every cookie, browser-storage key and third party the site uses.
 * /cookies renders it, the consent store uses it to delete storage whose category was withdrawn,
 * and SimFrame uses SIMULATOR_EMBEDS to decide when a simulator iframe may load.
 * See "Cookies and consent" in docs/ARCHITECTURE.md before adding to it.
 *
 * Browser-safe: no server imports.
 */

/** Consent categories. "necessary" is always on; the others need opt-in consent. */
export const CONSENT_CATEGORIES = ["necessary", "functional", "analytics"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
/** Categories the user can switch on or off. */
export type OptionalCategory = Exclude<ConsentCategory, "necessary">;
export const OPTIONAL_CATEGORIES: readonly OptionalCategory[] = ["functional", "analytics"];

export const CATEGORY_INFO: Record<ConsentCategory, { title: string; description: string }> = {
  necessary: {
    title: "הכרחיות",
    description:
      "נדרשות כדי שהאתר יעבוד ולא ניתן לכבות אותן: התחברות ושמירה על החשבון, הגנה מפני זיוף בקשות, שמירת בחירת העוגיות שלכם ושמירת שאלות שביקשתם במפורש לשמור לחזרה.",
  },
  functional: {
    title: "פונקציונליות",
    description:
      "זוכרות העדפות ונתוני לימוד בדפדפן הזה: היסטוריית המבחנים ורמת הרישיון שבחרתם בסימולטור הבחינות, והתקדמות בתוך מעבדות מוטמעות. בלעדיהן הכל עובד, אבל נשכח כשסוגרים את הדף.",
  },
  analytics: {
    title: "מדידה וניתוח",
    description:
      "סטטיסטיקת שימוש וביצועים מצטברת. באתר עצמו אין כלי מדידה; המעבדות המוטמעות (סימולטורים) טוענות את Cloudflare Web Analytics.",
  },
};

export type StorageKind = "cookie" | "localStorage" | "sessionStorage" | "network";

export interface StorageItem {
  /** Cookie name, storage key, or third-party host. */
  name: string;
  kind: StorageKind;
  category: ConsentCategory;
  /** Who sets / receives it. */
  party: "first" | "third";
  /** Origin that sets it, when it isn't this site. */
  origin?: string;
  /** Hebrew, shown on /cookies. */
  purpose: string;
  /** Hebrew, shown on /cookies. */
  duration: string;
  /** Hebrew, optional extra note (e.g. production name prefix). */
  note?: string;
}

/** First-party items: set by this site's own code or by Auth.js. */
export const FIRST_PARTY_ITEMS: readonly StorageItem[] = [
  {
    name: "authjs.session-token",
    kind: "cookie",
    category: "necessary",
    party: "first",
    purpose: "שומרת את ההתחברות לחשבון (JWT חתום ומוצפן). נוצרת רק אחרי התחברות.",
    duration: "30 יום, מתחדשת בשימוש; נמחקת ביציאה",
    note: "בשרת המאובטח נקראת ‎__Secure-authjs.session-token",
  },
  {
    name: "authjs.csrf-token",
    kind: "cookie",
    category: "necessary",
    party: "first",
    purpose: "הגנה מפני זיוף בקשות (CSRF) בתהליך ההתחברות.",
    duration: "עד סגירת הדפדפן",
    note: "בשרת המאובטח נקראת ‎__Host-authjs.csrf-token",
  },
  {
    name: "authjs.callback-url",
    kind: "cookie",
    category: "necessary",
    party: "first",
    purpose: "זוכרת לאיזה עמוד לחזור אחרי ההתחברות.",
    duration: "עד סגירת הדפדפן",
    note: "בשרת המאובטח נקראת ‎__Secure-authjs.callback-url",
  },
  {
    name: "authjs.pkce.code_verifier, authjs.state, authjs.nonce",
    kind: "cookie",
    category: "necessary",
    party: "first",
    purpose: "אבטחת ההתחברות עם Google (OAuth). נוצרות רק כשמתחברים עם Google.",
    duration: "15 דקות",
  },
  {
    name: "electricademy.consent",
    kind: "localStorage",
    category: "necessary",
    party: "first",
    purpose: "שומרת את בחירת העוגיות שלכם, מתי בחרתם ובאיזו גרסת מדיניות, כדי שלא נשאל שוב בכל עמוד.",
    duration: "6 חודשים, ואז נשאל שוב (או מוקדם יותר אם המדיניות משתנה)",
  },
  {
    name: "electricademy.license-exam.v1",
    kind: "localStorage",
    category: "necessary",
    party: "first",
    purpose: "השאלות שסימנתם בכפתור \"שמירה לחזרה\" בסימולטור בחינות הרישוי. נשמר רק כשאתם לוחצים על הכפתור.",
    duration: "עד שתסירו את הסימון או תמחקו את נתוני האתר בדפדפן",
  },
  {
    name: "electricademy.license-exam.prefs.v1",
    kind: "localStorage",
    category: "functional",
    party: "first",
    purpose: "היסטוריית המבחנים שעשיתם בדפדפן הזה ורמת הרישיון שבחרתם בפעם האחרונה.",
    duration: "עד שתבטלו את ההסכמה (ואז נמחק) או תמחקו את נתוני האתר",
  },
];

/** What an embedded simulator (iframe on another origin) stores or loads, as observed in the browser. */
export interface SimulatorEmbed {
  origin: string;
  /** Categories that must be granted before the iframe may load. Empty = loads immediately. */
  requires: readonly OptionalCategory[];
  items: readonly StorageItem[];
}

const cloudflareBeacon = (origin: string): StorageItem => ({
  name: "static.cloudflareinsights.com",
  kind: "network",
  category: "analytics",
  party: "third",
  origin,
  purpose:
    "Cloudflare Web Analytics: סקריפט שאוסף נתוני ביצועים וביקור (כתובת העמוד, זמני טעינה, סוג הדפדפן) ושולח אותם ל-Cloudflare. לא שומר עוגיות.",
  duration: "לא נשמר בדפדפן",
});

/**
 * Embedded simulators, keyed by slug. Inventoried with Playwright (2026-11): none sets cookies;
 * all four load Cloudflare Web Analytics, which Cloudflare injects at the edge.
 * If the owner turns that off in Cloudflare, drop the beacon and "analytics" here.
 */
export const SIMULATOR_EMBEDS: Record<string, SimulatorEmbed> = {
  "hv-edu": {
    origin: "https://hv-edu.haviv.pro",
    requires: ["analytics"],
    items: [cloudflareBeacon("https://hv-edu.haviv.pro")],
  },
  "genset-edu": {
    origin: "https://genset-edu.haviv.pro",
    requires: ["analytics"],
    items: [cloudflareBeacon("https://genset-edu.haviv.pro")],
  },
  "protect-edu": {
    origin: "https://protect-edu.haviv.pro",
    requires: ["functional", "analytics"],
    items: [
      {
        name: "protectEdu.v2",
        kind: "localStorage",
        category: "functional",
        party: "third",
        origin: "https://protect-edu.haviv.pro",
        purpose: "התקדמות והגדרות בתוך מעבדת ההגנות.",
        duration: "עד מחיקת נתוני האתר בדפדפן",
      },
      cloudflareBeacon("https://protect-edu.haviv.pro"),
    ],
  },
  "agl-edu": {
    origin: "https://agl-edu.haviv.pro",
    requires: ["functional", "analytics"],
    items: [
      {
        name: "agl-visited",
        kind: "localStorage",
        category: "functional",
        party: "third",
        origin: "https://agl-edu.haviv.pro",
        purpose: "זוכרת אילו יחידות במעבדת תאורת המסלולים כבר פתחתם.",
        duration: "עד מחיקת נתוני האתר בדפדפן",
      },
      cloudflareBeacon("https://agl-edu.haviv.pro"),
      {
        name: "fonts.googleapis.com, fonts.gstatic.com, cdnjs.cloudflare.com",
        kind: "network",
        category: "functional",
        party: "third",
        origin: "https://agl-edu.haviv.pro",
        purpose: "גופנים (Google Fonts) וספריית קוד (cdnjs) שהמעבדה טוענת. השרתים האלה מקבלים את כתובת ה-IP שלכם. לא שומרים עוגיות.",
        duration: "לא נשמר בדפדפן",
      },
    ],
  },
};

/** Simulators not inventoried yet are treated conservatively. */
export const UNKNOWN_EMBED_REQUIRES: readonly OptionalCategory[] = ["functional", "analytics"];

export function simulatorEmbed(slug: string): SimulatorEmbed | undefined {
  return SIMULATOR_EMBEDS[slug];
}
