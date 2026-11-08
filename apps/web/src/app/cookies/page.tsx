import Link from "next/link";
import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/consent/ConsentManager";
import {
  CATEGORY_INFO,
  CONSENT_CATEGORIES,
  FIRST_PARTY_ITEMS,
  SIMULATOR_EMBEDS,
  type StorageItem,
  type StorageKind,
} from "@/lib/consent/registry";
import { CONSENT_MAX_AGE_DAYS, POLICY_VERSION } from "@/lib/consent/state";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "מדיניות עוגיות",
  description: "אילו עוגיות ונתונים נשמרים בדפדפן באתר Electricademy, למה, לכמה זמן, ואיך לשנות את הבחירה.",
};

const KIND_LABEL: Record<StorageKind, string> = {
  cookie: "עוגייה",
  localStorage: "אחסון מקומי (localStorage)",
  sessionStorage: "אחסון לשונית (sessionStorage)",
  network: "טעינה משרת חיצוני",
};

const SIM_NAMES: Record<string, string> = {
  "hv-edu": "מעבדת מתח גבוה",
  "genset-edu": "מעבדת גנרטורים",
  "protect-edu": "מעבדת הגנות",
  "agl-edu": "מעבדת תאורת מסלולים",
};

const policyDate = new Date(POLICY_VERSION).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
const months = Math.round(CONSENT_MAX_AGE_DAYS / 30.4);

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">מדיניות עוגיות</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          גרסה מ־<time dateTime={POLICY_VERSION}>{policyDate}</time>
        </p>
        <p>
          העמוד מפרט כל עוגייה, כל נתון שנשמר בדפדפן וכל שירות חיצוני שהאתר טוען. אנחנו פועלים לפי תקנות הפרטיות האירופיות (GDPR והנחיית
          ePrivacy) ולפי הנחיות ה־EDPB: בלי הסכמה נשמר רק מה שהכרחי.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <CookieSettingsButton className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            שינוי הגדרות העוגיות
          </CookieSettingsButton>
          <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
            מדיניות הפרטיות
          </Link>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">מה הן עוגיות ואחסון מקומי</h2>
        <p>
          עוגיות (cookies) הן קבצים קטנים שאתר שומר בדפדפן. אחסון מקומי (localStorage) דומה, אבל לא נשלח לשרת. בעמוד הזה המילה &quot;עוגיות&quot;
          כוללת את שניהם, וגם סקריפטים חיצוניים שקוראים מידע מהדפדפן.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">איך אנחנו מבקשים הסכמה</h2>
        <ul className="list-disc space-y-1 ps-5">
          <li>בביקור הראשון מופיעה הודעה עם &quot;אישור הכל&quot;, &quot;דחיית הכל&quot; ו&quot;הגדרות&quot; לבחירה לפי קטגוריה. אף קטגוריה לא מסומנת מראש.</li>
          <li>עד שתבחרו, ואם תדחו, נשמרות רק עוגיות הכרחיות. האתר כולו עובד גם בלי הסכמה.</li>
          <li>
            הבחירה נשמרת בדפדפן עם מועד הבחירה וגרסת המדיניות, לתקופה של {months} חודשים. אחרי זה, או כשהמדיניות משתנה, נשאל שוב.
          </li>
          <li>אפשר לשנות או לבטל את ההסכמה בכל עת בקישור &quot;הגדרות עוגיות&quot; בתחתית כל עמוד. כשמבטלים, הנתונים של אותה קטגוריה נמחקים מהדפדפן.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">מה האתר שומר</h2>
        {CONSENT_CATEGORIES.map((c) => {
          const items = FIRST_PARTY_ITEMS.filter((i) => i.category === c);
          return (
            <div key={c} className="space-y-2">
              <h3 className="text-lg font-bold">
                {CATEGORY_INFO[c].title}
                {c === "necessary" ? <span className="ms-2 text-sm font-semibold text-slate-600 dark:text-slate-400">(לא דורשות הסכמה)</span> : null}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{CATEGORY_INFO[c].description}</p>
              {items.length ? <ItemList items={items} /> : <p className="text-sm text-slate-600 dark:text-slate-400">האתר עצמו לא משתמש בקטגוריה הזו.</p>}
            </div>
          );
        })}
        <div className="space-y-2">
          <h3 className="text-lg font-bold">שיווק ופרסום</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">אין. האתר לא מציג פרסומות ולא משתמש בעוגיות מעקב או פרסום.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">מעבדות מוטמעות (סימולטורים)</h2>
        <p>
          הסימולטורים פועלים מאתרים נפרדים ומוצגים בתוך מסגרת (iframe). מסגרת כזו נטענת רק אחרי שהסכמתם לקטגוריות שהיא צריכה; עד אז מוצג במקומה
          כפתור טעינה, ותמיד אפשר לפתוח את המעבדה בלשונית חדשה. אין לנו גישה למה שהמעבדות שומרות באתר שלהן, ולכן ביטול ההסכמה מפסיק את הטעינה שלהן
          אבל לא מוחק את מה שכבר נשמר שם. כדי למחוק, נקו את נתוני האתר של כתובת המעבדה בהגדרות הדפדפן.
        </p>
        {Object.entries(SIMULATOR_EMBEDS).map(([slug, embed]) => (
          <div key={slug} className="space-y-2">
            <h3 className="font-bold">
              {SIM_NAMES[slug] ?? slug} <bdi dir="ltr" className="text-sm font-normal text-slate-600 dark:text-slate-400">{new URL(embed.origin).host}</bdi>
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              נטענת אחרי הסכמה ל: {embed.requires.map((c) => CATEGORY_INFO[c].title).join(", ")}. לא שומרת עוגיות.
            </p>
            <ItemList items={embed.items} />
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">שירותי תשתית</h2>
        <p>
          הגופנים באתר מאוחסנים אצלנו, ואין באתר עצמו כלי מדידה, פרסום או רשתות חברתיות. האתר מוגש דרך Cloudflare (רשת הפצה ואבטחה). אם Cloudflare
          מזהה תעבורה חשודה, הוא עשוי לשמור עוגיית אבטחה (למשל <bdi dir="ltr">__cf_bm</bdi> או <bdi dir="ltr">cf_clearance</bdi>) לזמן קצר; זו עוגייה
          הכרחית להגנה על האתר.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">מחיקה דרך הדפדפן</h2>
        <p>
          בכל דפדפן אפשר לראות ולמחוק עוגיות ונתוני אתרים, וגם לחסום אותם. אם תמחקו את נתוני האתר, נשאל שוב לגבי עוגיות בביקור הבא. אם תחסמו עוגיות
          לגמרי, לא תוכלו להתחבר לחשבון.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">יצירת קשר</h2>
        <p>
          שאלות על המדיניות: {LEGAL.controllerName}, <bdi>{LEGAL.privacyEmail}</bdi>. פרטים נוספים על המידע שאנחנו מעבדים ועל הזכויות שלכם ב
          <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

function ItemList({ items }: { items: readonly StorageItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.name} className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="font-mono text-[13px] font-semibold break-all" dir="ltr">
            {item.name}
          </p>
          <dl className="mt-2 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 sm:grid-cols-[8rem_1fr] sm:gap-x-4">
            <dt className="font-semibold text-slate-600 dark:text-slate-400">מטרה</dt>
            <dd>{item.purpose}</dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">משך שמירה</dt>
            <dd>{item.duration}</dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">צד</dt>
            <dd>{item.party === "first" ? "צד ראשון (האתר הזה)" : <>צד שלישי, נטען דרך <bdi dir="ltr">{new URL(item.origin ?? "https://unknown").host}</bdi></>}</dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">סוג</dt>
            <dd>{KIND_LABEL[item.kind]}</dd>
            <dt className="font-semibold text-slate-600 dark:text-slate-400">קטגוריה</dt>
            <dd>{CATEGORY_INFO[item.category].title}</dd>
            {item.note && (
              <>
                <dt className="font-semibold text-slate-600 dark:text-slate-400">הערה</dt>
                <dd>{item.note}</dd>
              </>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}
