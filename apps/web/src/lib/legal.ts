/**
 * Facts about the site owner shown on legal pages (/privacy, /cookies).
 * Every value in brackets is a placeholder the owner must fill in once, here. Do not invent them.
 */
export const LEGAL = {
  /** Data controller: the person or company that runs the site. */
  controllerName: "[להשלמה: שם בעל האתר / שם החברה]",
  /** Company or ID number, if a company. */
  controllerId: "[להשלמה: מספר חברה או עוסק]",
  controllerAddress: "[להשלמה: כתובת למשלוח דואר]",
  privacyEmail: "[להשלמה: כתובת מייל לפניות פרטיות]",
  /** Where the servers (Coolify host, Postgres) physically run. */
  hostingLocation: "[להשלמה: מיקום השרתים וספק האחסון]",
  /** Which providers process data outside the EU / Israel, and under which transfer mechanism (adequacy, SCCs). */
  internationalTransfers: "[להשלמה: אילו ספקים מעבדים מידע מחוץ לאיחוד האירופי ולישראל, ובאיזה מנגנון העברה]",
  /** Minimum age to open an account, and whether a parent's consent is needed below it (GDPR art. 8). */
  minimumAge: "[להשלמה: גיל מינימלי לפתיחת חשבון ומדיניות לגבי קטינים]",
  /** How long server / proxy logs (IP addresses) are kept. */
  logRetention: "[להשלמה: משך שמירת יומני שרת]",
  /** Optional: an EU representative (GDPR art. 27) if the owner has no EU establishment and targets EU users. */
  euRepresentative: "[להשלמה: נציג באיחוד האירופי, אם נדרש]",
  /** Date the privacy policy text below was last changed. */
  privacyUpdated: "[להשלמה: תאריך עדכון מדיניות הפרטיות]",
} as const;

