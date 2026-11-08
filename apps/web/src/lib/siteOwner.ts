/**
 * Details about the site's owner that legal pages need (the accessibility statement at /accessibility).
 * The owner fills these in once, here. Every value in [square brackets] is a placeholder: replace it before going live.
 * See docs/ARCHITECTURE.md → Accessibility.
 */
export const SITE_OWNER = {
  /** Legal name of the business or company that runs the site. */
  legalName: "[להשלמה: שם העסק או החברה]",
  /** Postal address for accessibility requests and other legal correspondence. */
  postalAddress: "[להשלמה: כתובת למשלוח דואר]",
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
