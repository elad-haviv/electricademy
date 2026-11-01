import Image from "next/image";
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
      <section className="relative isolate overflow-hidden rounded-3xl bg-brand-950 px-6 py-16 text-white sm:px-12 sm:py-24">
        <Image
          src="/images/hero-substation.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="-z-20 object-cover object-left"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-brand-950 via-brand-950/80 to-brand-950/10" />
        <p dir="ltr" className="mb-3 text-end font-mono text-sm tracking-widest text-spark-300 uppercase">
          From Zero to Hero
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">
          לומדים חשמל, מהנורה הראשונה ועד תחנת הכוח
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-100">
          מסלולי לימוד, סימולטורים אינטראקטיביים, מחשבונים מקצועיים וקהילה של לומדים ואנשי מקצוע, במקום אחד.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tracks/basics" className={buttonClass("primary", "bg-spark-400 text-slate-900 hover:bg-spark-300")}>
            מתחילים מאפס
          </Link>
          <Link href="/tracks" className={buttonClass("secondary", "bg-white/10 text-white ring-white/30 backdrop-blur hover:bg-white/20")}>
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
              <Card className="h-full overflow-hidden p-0 transition group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-brand-400">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0d1a4a]">
                  <Image
                    src={t.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute start-3 top-3">
                    {t.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  <p className="text-xs font-medium text-brand-700 dark:text-brand-300">{t.audience}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          image="/images/license-exam.webp"
          badge={<Badge tone="pro">בקרוב</Badge>}
          title="סימולטור בחינות רישוי"
          text="מבחני תרגול מתוזמנים, בנק שאלות לפי תקנות והסברים מלאים."
          href="/license-exam"
          cta="להצטרפות לרשימת ההמתנה"
        />
        <FeatureCard
          image="/images/simulators.webp"
          badge={<Badge tone="brand">סימולטורים</Badge>}
          title="ללמוד בידיים"
          text="לוחות מיתוג מתח בינוני בתלת־ממד, גנרטורים, הגנה בפני חשמול ותאורת שדות תעופה."
          href="/simulators"
          cta="לסימולטורים"
        />
        <FeatureCard
          image="/images/community.webp"
          badge={<Badge tone="brand">קהילה</Badge>}
          title="שואלים, עונים, לומדים יחד"
          text="מתלמידי בגרות ועד מהנדסי מערכות הספק. כל שאלה מקבלת מענה."
          href="/community"
          cta="לקהילה"
          contain
          className="md:col-span-2"
        />
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

function FeatureCard({
  image,
  badge,
  title,
  text,
  href,
  cta,
  className,
  contain = false,
}: {
  contain?: boolean;
  image: string;
  badge: React.ReactNode;
  title: string;
  text: string;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`group relative isolate flex min-h-72 overflow-hidden rounded-3xl bg-[#0d1a4a] text-white ${className ?? ""}`}>
      {contain && (
        // Wide card (desktop): show the whole render in a 4:3 box at the end side, fading into the card.
        <div className="absolute inset-y-0 end-0 -z-20 hidden aspect-[4/3] [mask-image:linear-gradient(to_left,transparent,black_30%)] md:block">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`-z-20 object-cover object-left opacity-60 transition duration-500 group-hover:scale-105 sm:opacity-100 ${contain ? "md:hidden" : ""}`}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-[#0d1a4a] via-[#0d1a4a]/85 to-transparent" />
      <div className="flex max-w-sm flex-col justify-center gap-2 p-6 sm:p-8">
        <span>{badge}</span>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-brand-100">{text}</p>
        <span className={buttonClass("primary", "mt-3 self-start bg-spark-400 text-slate-900 group-hover:bg-spark-300")}>{cta}</span>
      </div>
    </Link>
  );
}
