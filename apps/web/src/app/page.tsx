import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  buttonClass,
  Card,
  IconArrowLeft,
  IconChevronLeft,
  IconFile,
  IconGraduation,
  IconHardHat,
  IconLandmark,
  IconRuler,
  IconSprout,
  SectionHeading,
} from "@electricademy/ui";
import { listArticles, TRACKS } from "@electricademy/content";
import { formatDate } from "@/lib/labels";

/** "Where do I start?" Each audience goes straight to the place that serves it. */
const AUDIENCES = [
  { Icon: IconSprout, title: "מתחילים מאפס", text: "בלי ידע מוקדם: מתח, זרם והתנגדות, צעד אחר צעד.", href: "/tracks/basics" },
  { Icon: IconGraduation, title: "בגרות ומה\"ט", text: "הכנה לבחינות משרד החינוך ומה\"ט, עם תרגול ממוקד.", href: "/tracks/bagrut" },
  { Icon: IconLandmark, title: "סטודנטים לתואר", text: "מערכות הספק, מכונות והגנות ברמה האקדמית.", href: "/tracks/academic" },
  { Icon: IconFile, title: "בחינות רישוי", text: "תקנות, הגנות והארקות, ובקרוב גם סימולטור בחינות.", href: "/tracks/licensing" },
  { Icon: IconHardHat, title: "חשמלאים בשטח", text: "מחשבונים וכלים לעבודה היומיומית.", href: "/tools" },
  { Icon: IconRuler, title: "מתכננים ומהנדסים", text: "חישובים מתקדמים, חידושים ונישות מקצועיות.", href: "/tracks/professionals" },
];

export default function HomePage() {
  const articles = listArticles().slice(0, 3);
  return (
    <div className="space-y-16">
      <section className="relative isolate overflow-hidden rounded-3xl bg-brand-950 px-6 py-14 text-white shadow-(--shadow-raised) sm:px-12 sm:py-24">
        <Image
          src="/images/hero-substation.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="-z-20 object-cover object-left opacity-50 sm:opacity-100"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-brand-950 via-brand-950/80 to-brand-950/10" />
        <p dir="ltr" className="mb-4 text-end font-mono text-xs font-semibold tracking-[0.2em] text-spark-300 uppercase sm:text-sm">
          From Zero to Hero
        </p>
        <h1 className="max-w-2xl text-[2.25rem] leading-[1.15] font-extrabold tracking-tight drop-shadow-lg sm:text-6xl">
          לומדים חשמל, מהנורה הראשונה ועד תחנת הכוח
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-100 sm:text-xl">
          מסלולי לימוד, סימולטורים אינטראקטיביים, מחשבונים מקצועיים וקהילה של לומדים ואנשי מקצוע, במקום אחד.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tracks/basics" className={buttonClass("spark", undefined, "lg")}>
            מתחילים מאפס, בחינם
            <IconArrowLeft className="size-5" />
          </Link>
          <Link href="/tracks" className={buttonClass("onDark", undefined, "lg")}>
            לכל המסלולים
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading title="מאיפה מתחילים?" subtitle="בחרו את מה שמתאר אתכם הכי טוב. אפשר להתקדם הלאה בכל שלב." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ Icon, title, text, href }) => (
            <li key={title}>
              <Link href={href} className="group block h-full rounded-(--radius-card) outline-none">
                <Card interactive className="flex h-full items-center gap-4 p-4 sm:p-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-300">
                    <Icon className="size-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{title}</span>
                    <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{text}</span>
                  </span>
                  <IconChevronLeft className="size-5 shrink-0 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-brand-600" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading
          title="מסלולי לימוד"
          action={
            <Link href="/tracks" className={buttonClass("ghost", "text-brand-700 dark:text-brand-300")}>
              לכל המסלולים
              <IconArrowLeft className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.slice(0, 6).map((t) => (
            <Link key={t.slug} href={`/tracks/${t.slug}`} className="group rounded-(--radius-card) outline-none">
              <Card interactive className="h-full overflow-hidden p-0 sm:p-0">
                <div className="relative aspect-[16/10] overflow-hidden bg-navy-900">
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
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{t.audience}</p>
                  <h3 className="mt-0.5 text-lg font-extrabold group-hover:text-brand-700 dark:group-hover:text-brand-300">{t.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
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
              <Link href="/articles" className={buttonClass("ghost", "text-brand-700 dark:text-brand-300")}>
                לכל המאמרים
                <IconArrowLeft className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/articles/${a.slug}`} className="group rounded-(--radius-card) outline-none">
                <Card interactive className="h-full">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(a.date)}</p>
                  <h3 className="mt-1 leading-snug font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{a.title}</h3>
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
    <Link href={href} className={`group relative isolate flex min-h-72 overflow-hidden rounded-3xl bg-navy-900 text-white shadow-(--shadow-card) transition hover:shadow-(--shadow-raised) ${className ?? ""}`}>
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
        className={`-z-20 object-cover object-left opacity-40 transition duration-500 group-hover:scale-105 sm:opacity-100 ${contain ? "md:hidden" : ""}`}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-navy-900 via-navy-900/85 to-transparent" />
      <div className="flex max-w-sm flex-col justify-center gap-2 p-6 sm:p-8">
        <span>{badge}</span>
        <h3 className="text-2xl font-extrabold">{title}</h3>
        <p className="text-brand-100">{text}</p>
        <span className={buttonClass("spark", "mt-3 self-start group-hover:bg-spark-300")}>
          {cta}
          <IconArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
