import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@electricademy/ui";
import { ACCESSIBILITY_CONTACT, ACCESSIBILITY_REVIEWED_AT, isPlaceholder, SITE_OWNER } from "@/lib/siteOwner";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "רמת הנגישות של אתר Electricademy, מה הונגש, המגבלות הידועות ודרכי הפנייה לרכז/ת הנגישות.",
};

const reviewed = new Date(`${ACCESSIBILITY_REVIEWED_AT}T12:00:00Z`).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

/** A placeholder value is shown highlighted so it is not missed before launch. */
function Value({ children }: { children: string }) {
  return isPlaceholder(children) ? <mark className="rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-950 dark:text-amber-100">{children}</mark> : <>{children}</>;
}

const DONE = [
  "ניווט מלא במקלדת, עם סימון פוקוס בולט בכל רכיב, וקישור ״דילוג לתוכן הראשי״ בראש כל עמוד.",
  "מבנה עמודים עקבי: כותרות לפי סדר, אזורי ניווט ותוכן מסומנים, וכותרת ייחודית לכל עמוד. שפת האתר מוגדרת כעברית, מימין לשמאל.",
  "ניגודיות צבעים לפי רמה AA בתצוגה הבהירה ובתצוגה הכהה (האתר עוקב אחרי הגדרת המכשיר).",
  "התאמה לכל גודל מסך: הגדלת טקסט עד 200% ותצוגה בטלפון ברוחב 320 פיקסלים בלי גלילה לרוחב.",
  "כיבוד ההגדרה ״הפחתת תנועה״ של מערכת ההפעלה: אנימציות נעצרות.",
  "טקסט חלופי לתמונות ולאיורים בעלי משמעות; סמלים קישוטיים מוסתרים מקוראי מסך.",
  "נוסחאות מתמטיות מוצגות גם כ־MathML, כך שקוראי מסך מקריאים אותן.",
  "טפסים עם תוויות, והודעות שגיאה ועדכונים שמוכרזים לקוראי מסך.",
  "בסימולטור בחינות הרישוי: חלונות הדו־שיח לוכדים את הפוקוס, נסגרים במקש Escape ומחזירים את הפוקוס למקומו; התראות הזמן מוכרזות רק ב־30, 5 ו־1 דקות לסיום; אפשר לבחור בחינה ללא הגבלת זמן.",
];

const LIMITS = [
  {
    title: "איורים ושרטוטים בשאלות הבחינה",
    body: "שרטוטי חשמל ואיורים במאגר השאלות הרשמי לקוחים כתמונות מקובץ ה־PDF של משרד העבודה. לחלקם יש רק תיאור כללי (״איור 1 לשאלה…״), ולא תיאור מלא של המעגל. שאלות שהנוסח שלהן מוצג כתמונה כוללות את הנוסח גם כטקסט לקוראי מסך.",
  },
  {
    title: "סימולטורים חיצוניים",
    body: "הסימולטורים התלת־ממדיים והמעבדות (בעמודי ״סימולטורים״) הם יישומים נפרדים שמוטמעים באתר במסגרת (iframe). הם דורשים עבודה עם עכבר או מסך מגע ואינם נגישים במלואם למקלדת ולקוראי מסך.",
  },
  {
    title: "מסמכים ותוכן חיצוני",
    body: "קובצי PDF של גורמים אחרים (כמו מאגר השאלות של משרד העבודה) ואתרים שאנחנו מקשרים אליהם אינם בשליטתנו, ועשויים שלא להיות נגישים. איורים בחוק ובתקנות מגיעים מוויקיטקסט, וחלקם בלי תיאור מפורט.",
  },
  {
    title: "תוכן שמשתמשים מפרסמים",
    body: "הודעות בקהילה ובדיוני השאלות נכתבות על ידי המשתמשים, ואיננו יכולים להבטיח שהן נגישות (למשל תמונות בלי תיאור).",
  },
];

export default function AccessibilityPage() {
  const c = ACCESSIBILITY_CONTACT;
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">הצהרת נגישות</h1>
        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          אנחנו רוצים שכל מי שלומד חשמל יוכל להשתמש ב־Electricademy, כולל אנשים עם מוגבלות. השקענו בהנגשת האתר, ונמשיך לשפר אותו.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          תאריך הבדיקה האחרונה: <time dateTime={ACCESSIBILITY_REVIEWED_AT}>{reviewed}</time>
        </p>
      </header>

      <section aria-labelledby="level" className="space-y-3">
        <h2 id="level" className="text-xl font-bold">
          רמת הנגישות
        </h2>
        <p className="leading-relaxed">
          האתר הותאם לדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג־2013 (תקנה 35), ולתקן הישראלי <strong>ת״י 5568</strong> ברמה{" "}
          <strong>AA</strong>, המבוסס על הנחיות <span dir="ltr">WCAG 2.0</span>. בפועל בדקנו את האתר מול ההנחיות המעודכנות יותר,{" "}
          <strong dir="ltr">WCAG 2.1 AA</strong>.
        </p>
        <p className="leading-relaxed">
          ההנגשה בנויה בקוד האתר עצמו, בלי ״תוסף נגישות״ חיצוני. כך היא עובדת עם הכלים שכבר יש לכם: קורא מסך, הגדלה בדפדפן, ניווט במקלדת והגדרות הנגישות של
          המכשיר.
        </p>
      </section>

      <section aria-labelledby="done" className="space-y-3">
        <h2 id="done" className="text-xl font-bold">
          מה הונגש
        </h2>
        <ul className="list-disc space-y-2 ps-6 leading-relaxed marker:text-brand-600 dark:marker:text-brand-300">
          {DONE.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          האתר נבדק בכלי הבדיקה האוטומטי axe בכל סוגי העמודים, בטלפון ובמחשב ובשתי ערכות הצבעים, ובבדיקות ידניות של ניווט במקלדת, הגדלה ותצוגה צרה. את
          הבדיקה האוטומטית אנחנו מריצים שוב כשהאתר משתנה.
        </p>
      </section>

      <section aria-labelledby="limits" className="space-y-3">
        <h2 id="limits" className="text-xl font-bold">
          מגבלות ידועות
        </h2>
        <p className="leading-relaxed">למרות המאמצים, חלקים מהאתר עדיין אינם נגישים במלואם:</p>
        <dl className="space-y-4">
          {LIMITS.map((l) => (
            <div key={l.title} className="border-s-4 border-slate-300 ps-4 dark:border-slate-600">
              <dt className="font-bold">{l.title}</dt>
              <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">{l.body}</dd>
            </div>
          ))}
        </dl>
        <p className="leading-relaxed">אם נתקלתם בתוכן שאינו נגיש לכם, פנו אלינו ונמצא דרך להנגיש לכם אותו, למשל בפורמט אחר.</p>
      </section>

      <section aria-labelledby="contact" className="space-y-3">
        <h2 id="contact" className="text-xl font-bold">
          פנייה לרכז/ת הנגישות ובקשת התאמה
        </h2>
        <p className="leading-relaxed">
          נתקלתם בבעיה, או שאתם צריכים התאמה כדי להשתמש באתר או בתוכן מסוים? פנו לרכז/ת הנגישות. כדי שנוכל לעזור מהר, ציינו:
        </p>
        <ul className="list-disc space-y-1 ps-6 leading-relaxed">
          <li>את כתובת העמוד או את שם התוכן;</li>
          <li>מה ניסיתם לעשות ומה הבעיה;</li>
          <li>באיזה דפדפן, מכשיר וטכנולוגיה מסייעת השתמשתם (אם השתמשתם);</li>
          <li>איך נוח לכם שנחזור אליכם.</li>
        </ul>
        <Card className="space-y-3">
          <h3 className="font-bold">פרטי ההתקשרות</h3>
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold text-slate-600 dark:text-slate-400">רכז/ת נגישות</dt>
            <dd>
              <Value>{c.coordinatorName}</Value>
            </dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">טלפון</dt>
            <dd>
              {isPlaceholder(c.phone) ? (
                <Value>{c.phone}</Value>
              ) : (
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} dir="ltr" className="font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
                  {c.phone}
                </a>
              )}
            </dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">אימייל</dt>
            <dd>
              {isPlaceholder(c.email) ? (
                <Value>{c.email}</Value>
              ) : (
                <a href={`mailto:${c.email}`} dir="ltr" className="font-semibold break-all text-brand-700 underline underline-offset-4 dark:text-brand-300">
                  {c.email}
                </a>
              )}
            </dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">כתובת למשלוח דואר</dt>
            <dd>
              <Value>{SITE_OWNER.postalAddress}</Value>
            </dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">מפעיל האתר</dt>
            <dd>
              <Value>{SITE_OWNER.legalName}</Value>
            </dd>
          </dl>
        </Card>
        {c.physicalAccess && <p className="leading-relaxed">{c.physicalAccess}</p>}
      </section>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        עדכון אחרון של ההצהרה: <time dateTime={ACCESSIBILITY_REVIEWED_AT}>{reviewed}</time>. <Link href="/" className="font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">לדף הבית</Link>
      </p>
    </article>
  );
}
