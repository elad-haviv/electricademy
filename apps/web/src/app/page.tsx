import Link from "next/link";
import { Badge, buttonClass, Card, SectionHeading } from "@electricademy/ui";
import { listArticles, TRACKS } from "@electricademy/content";
import { formatDate } from "@/lib/labels";

const AUDIENCES = [
  { icon: "🌱", title: "מתחילים מאפס", text: "בלי ידע מוקדם: מתח, זרם והתנגדות, צעד אחר צעד." },
  { icon: "🎓", title: "בגרות ומה\"ט", text: "הכנה לבחינות משרד החינוך ומה\"ט, עם תרגול ממוקד." },
  { icon: "🏛️", title: "סטודנטים לתואר", text: "מערכות הספק, מכונות והגנות ברמה האקדמית." },
  { icon: "📜", title: "בחינות רישוי", text: "תקנות, הגנות והארקות, ובקרוב גם סימולטור בחינות." },
  { icon: "🦺", title: "חשמלאים בשטח", text: "מחשבונים וכלים לעבודה היומיומית." },
  { icon: "📐", title: "מתכננים ומהנדסים", text: "חישובים מתקדמים, חידושים ונישות מקצועיות." },
];

export default function HomePage() {
  const articles = listArticles().slice(0, 3);
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div aria-hidden className="absolute -start-10 -top-10 text-[12rem] leading-none opacity-10">
          ⚡
        </div>
        <p dir="ltr" className="mb-3 text-end font-mono text-sm tracking-widest text-spark-300 uppercase sm:text-start">
          From Zero to Hero
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          לומדים חשמל, מהנורה הראשונה ועד תחנת הכוח
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-100">
          מסלולי לימוד, סימולטורים אינטראקטיביים, מחשבונים מקצועיים וקהילה של לומדים ואנשי מקצוע, במקום אחד.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tracks/basics" className={buttonClass("primary", "bg-spark-400 text-slate-900 hover:bg-spark-300")}>
            מתחילים מאפס
          </Link>
          <Link href="/tracks" className={buttonClass("secondary", "bg-white/10 text-white ring-white/30 hover:bg-white/20")}>
            לכל המסלולים
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading title="למי זה מתאים?" subtitle="בחרו נקודת פתיחה. אפשר להתקדם הלאה בכל שלב." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <Card key={a.title}>
              <p className="text-2xl" aria-hidden>
                {a.icon}
              </p>
              <h3 className="mt-2 font-bold">{a.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="מסלולי לימוד"
          action={
            <Link href="/tracks" className={buttonClass("ghost")}>
              הכל ←
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {TRACKS.slice(0, 6).map((t) => (
            <Link key={t.slug} href={`/tracks/${t.slug}`} className="group">
              <Card className="h-full transition group-hover:ring-brand-400">
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden>
                    {t.icon}
                  </span>
                  {t.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                </div>
                <h3 className="mt-3 text-lg font-bold">{t.title}</h3>
                <p className="text-xs font-medium text-brand-700 dark:text-brand-300">{t.audience}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white ring-0 dark:from-slate-900 dark:to-slate-950">
          <Badge tone="pro">בקרוב</Badge>
          <h3 className="mt-3 text-2xl font-bold">סימולטור בחינות רישוי</h3>
          <p className="mt-2 text-slate-300">מבחני תרגול מתוזמנים, בנק שאלות לפי תקנות והסברים מלאים.</p>
          <Link href="/license-exam" className={buttonClass("primary", "mt-5 bg-spark-400 text-slate-900 hover:bg-spark-300")}>
            להצטרפות לרשימת ההמתנה
          </Link>
        </Card>
        <Card>
          <Badge tone="brand">סימולטורים</Badge>
          <h3 className="mt-3 text-2xl font-bold">ללמוד בידיים</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            לוחות מיתוג מתח בינוני בתלת־ממד, גנרטורים, הגנה בפני חשמול ותאורת שדות תעופה.
          </p>
          <Link href="/simulators" className={buttonClass("secondary", "mt-5")}>
            לסימולטורים
          </Link>
        </Card>
      </section>

      {articles.length > 0 && (
        <section>
          <SectionHeading
            title="מאמרים וחדשות"
            action={
              <Link href="/articles" className={buttonClass("ghost")}>
                הכל ←
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/articles/${a.slug}`}>
                <Card className="h-full transition hover:ring-brand-400">
                  <p className="text-xs text-slate-500">{formatDate(a.date)}</p>
                  <h3 className="mt-1 font-bold">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{a.summary}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
