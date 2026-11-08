/**
 * THE one place for facts about the site's owner that legal pages need: /accessibility, /privacy and /cookies.
 * The owner fills these in once, here. Every value in [square brackets] is a placeholder and shows highlighted on the
 * page until it is replaced. Never invent them. See docs/ARCHITECTURE.md → Accessibility / Cookies and consent.
 */
export const SITE_OWNER = {
  /** Legal name of the business or company that runs the site (also the data controller on /privacy). */
  legalName: "[להשלמה: שם העסק או החברה]",
  /** Company number (ח.פ.) or licensed-dealer number (עוסק מורשה). */
  companyId: "[להשלמה: מספר חברה או עוסק]",
  /** Postal address for accessibility requests, privacy requests and other legal correspondence. */
  postalAddress: "[להשלמה: כתובת למשלוח דואר]",
  /** Email for privacy requests (access, deletion, objection). */
  privacyEmail: "[להשלמה: כתובת מייל לפניות פרטיות]",
} as const;

/** Facts for the privacy policy (/privacy). */
export const PRIVACY_DETAILS = {
  /** Where the servers (Coolify host, Postgres) physically run, and the hosting provider. */
  hostingLocation: "[להשלמה: מיקום השרתים וספק האחסון]",
  /** Which providers process data outside the EU / Israel, and under which transfer mechanism (adequacy, SCCs). */
  internationalTransfers: "[להשלמה: אילו ספקים מעבדים מידע מחוץ לאיחוד האירופי ולישראל, ובאיזה מנגנון העברה]",
  /** Minimum age to open an account, and whether a parent's consent is needed below it (GDPR art. 8). */
  minimumAge: "[להשלמה: גיל מינימלי לפתיחת חשבון ומדיניות לגבי קטינים]",
  /** How long server / proxy logs (IP addresses) are kept. */
  logRetention: "[להשלמה: משך שמירת יומני שרת]",
  /** Optional: an EU representative (GDPR art. 27) if the owner has no EU establishment and targets EU users. */
  euRepresentative: "[להשלמה: נציג באיחוד האירופי, אם נדרש]",
  /** Date the privacy policy text was last changed. */
  privacyUpdated: "[להשלמה: תאריך עדכון מדיניות הפרטיות]",
} as const;

export const ACCESSIBILITY_CONTACT = {
  /** The accessibility coordinator (רכז/ת נגישות). */
  coordinatorName: "[להשלמה: שם רכז/ת הנגישות]",
  phone: "[להשלמה: מספר טלפון]",
  email: "[להשלמה: כתובת אימייל]",
  /**
   * Physical accessibility of a place that receives the public, if there is one. Leave null when the service is only online.
   * Example: "המשרד ב[כתובת] נגיש לכיסאות גלגלים, עם חניית נכים ושירותים נגישים."
   */
  physicalAccess: null as string | null,
} as const;

/**
 * Date of the last accessibility review (ISO). 2026-11-08 is the date of the audit described in docs/ARCHITECTURE.md
 * (axe-core on every route plus manual checks). Update it after every review.
 */
export const ACCESSIBILITY_REVIEWED_AT = "2026-11-08";

/** True while a value is still a placeholder. */
export const isPlaceholder = (value: string) => value.startsWith("[להשלמה");
