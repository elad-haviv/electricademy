import Link from "next/link";
import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/consent/ConsentManager";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "איזה מידע אישי Electricademy אוסף, למה, למי הוא מועבר, כמה זמן הוא נשמר ומה הזכויות שלכם.",
};

const link = "font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300";

/** Minimal privacy notice (GDPR art. 13 / Israeli Privacy Protection Law). Owner facts come from lib/legal.ts. */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">מדיניות פרטיות</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">עודכן לאחרונה: {LEGAL.privacyUpdated}</p>
        <p>
          כאן מוסבר איזה מידע אישי אנחנו מעבדים כשאתם משתמשים ב־Electricademy, למה, ומה הזכויות שלכם. על עוגיות ונתונים שנשמרים בדפדפן ראו את{" "}
          <Link href="/cookies" className={link}>
            מדיניות העוגיות
          </Link>
          .
        </p>
      </header>

      <Section title="מי אחראי למידע">
        <p>האחראי לעיבוד המידע (Data Controller):</p>
        <ul className="list-none space-y-1">
          <li>{LEGAL.controllerName}</li>
          <li>{LEGAL.controllerId}</li>
          <li>{LEGAL.controllerAddress}</li>
          <li>
            פניות בנושא פרטיות: <bdi>{LEGAL.privacyEmail}</bdi>
          </li>
          <li>{LEGAL.euRepresentative}</li>
        </ul>
      </Section>

      <Section title="איזה מידע אנחנו מעבדים ולמה">
        <dl className="space-y-4">
          <Item term="חשבון משתמש">
            שם, כתובת אימייל ותמונת פרופיל (אם נכנסתם עם Google), ותאריך ההצטרפות. כשמתחברים עם Google נשמר גם הקישור לחשבון Google. המטרה: לאפשר
            התחברות ולשמור את ההתקדמות שלכם. בסיס חוקי: ביצוע ההתקשרות איתכם (סעיף 6(1)(ב) ל־GDPR).
          </Item>
          <Item term="התקדמות בלימוד">
            שיעורים שסימנתם כהושלמו, ניסיונות בבחנים ובמבחני הרישוי (התשובות והציון), אירועי התקדמות מהסימולטורים וניקוד XP. המטרה: להציג לכם את
            ההתקדמות באזור האישי. בסיס חוקי: ביצוע ההתקשרות.
          </Item>
          <Item term="תגובות ודיונים">
            שרשורים, תגובות בקהילה ובדיוני שאלות המבחן, הצבעות ודיווחים על תוכן. תגובות ושרשורים מוצגים לכל המבקרים יחד עם שם התצוגה שלכם. המטרה:
            הפעלת הקהילה ומניעת שימוש לרעה. בסיס חוקי: ביצוע ההתקשרות, ואינטרס לגיטימי בניהול הקהילה ובטיחותה (סעיף 6(1)(ו)).
          </Item>
          <Item term="התייעצות עם AI על שאלות מבחן">
            מה שאתם כותבים בחלון &quot;התייעצות עם AI&quot;, יחד עם נוסח השאלה, נשלח לשירות OpenRouter ומשם למודל השפה שנבחר, כדי לנסח תשובה. אנחנו
            לא שומרים את תוכן השיחה; נשמר רק מונה יומי של מספר ההודעות, כדי להגביל עלויות ושימוש לרעה. אל תכתבו בחלון פרטים אישיים. בסיס חוקי: ביצוע
            ההתקשרות (שירות שביקשתם).
          </Item>
          <Item term="רשימת המתנה">
            כתובת אימייל והמוצר שביקשתם לשמוע עליו. המטרה: לעדכן אתכם כשהמוצר זמין, ולא לשום דבר אחר. בסיס חוקי: הסכמה (סעיף 6(1)(א)); אפשר לבקש
            הסרה בכל עת.
          </Item>
          <Item term="מידע טכני">
            כתובת IP ופרטי הדפדפן מגיעים לשרתים ולספקי התשתית בכל בקשה, ונשמרים ביומני שרת לצורכי אבטחה ותפעול. בסיס חוקי: אינטרס לגיטימי באבטחת
            האתר.
          </Item>
        </dl>
        <p className="text-sm text-slate-700 dark:text-slate-300">אנחנו לא מוכרים מידע אישי, לא משתמשים בו לפרסום ולא מקבלים עליכם החלטות אוטומטיות.</p>
      </Section>

      <Section title="למי המידע מועבר">
        <ul className="list-disc space-y-1 ps-5">
          <li>ספק האחסון שבו פועלים השרת ומסד הנתונים: {LEGAL.hostingLocation}.</li>
          <li>Cloudflare, שדרכו האתר והמעבדות מוגשים (רשת הפצה ואבטחה).</li>
          <li>Google, רק אם בחרתם להתחבר עם חשבון Google.</li>
          <li>OpenRouter וספק מודל השפה שהוא מפעיל, רק אם השתמשתם בהתייעצות עם AI: הם מקבלים את מה שכתבתם ואת נוסח השאלה.</li>
          <li>ספק הדואר שדרכו נשלחים קישורי התחברות במייל, אם בחרתם בהתחברות במייל.</li>
          <li>אתרי המעבדות המוטמעות, אם טענתם אותן: הן מקבלות את מזהה המשתמש, השם וסוג המנוי שלכם כדי לשמור התקדמות.</li>
        </ul>
        <p>העברת מידע אל מחוץ לאיחוד האירופי ולישראל: {LEGAL.internationalTransfers}.</p>
      </Section>

      <Section title="כמה זמן המידע נשמר">
        <p>
          מידע החשבון, ההתקדמות והתגובות נשמרים כל עוד החשבון פעיל. כשהחשבון נמחק, נמחקים איתו גם ההתקדמות, התגובות וההצבעות. כתובת ברשימת המתנה
          נשמרת עד שהמוצר זמין או עד שתבקשו הסרה. יומני שרת: {LEGAL.logRetention}.
        </p>
      </Section>

      <Section title="קטינים">
        <p>{LEGAL.minimumAge}</p>
      </Section>

      <Section title="הזכויות שלכם">
        <p>
          לפי ה־GDPR ולפי חוק הגנת הפרטיות, התשמ&quot;א-1981, אתם זכאים לעיין במידע עליכם, לתקן אותו, למחוק אותו (כולל מחיקת החשבון), להגביל את
          העיבוד, להתנגד לעיבוד שמבוסס על אינטרס לגיטימי, לקבל את המידע בפורמט נייד, ולבטל הסכמה בכל עת בלי שזה יפגע בעיבוד שנעשה לפני כן.
        </p>
        <p>
          לכל בקשה כתבו ל־<bdi>{LEGAL.privacyEmail}</bdi>. אפשר גם להגיש תלונה לרשות להגנת הפרטיות בישראל, או לרשות הגנת המידע במדינת האיחוד שבה
          אתם גרים.
        </p>
      </Section>

      <Section title="עוגיות">
        <p>
          בלי הסכמה האתר שומר רק עוגיות הכרחיות. הפירוט המלא ב
          <Link href="/cookies" className={link}>
            מדיניות העוגיות
          </Link>
          , ושם וגם כאן אפשר לשנות את הבחירה:{" "}
          <CookieSettingsButton className={`${link} cursor-pointer`} />.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Item({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-bold">{term}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}
