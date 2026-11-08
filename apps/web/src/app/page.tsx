import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { listArticles, TRACKS } from "@electricademy/content";
import { formatDate } from "@/lib/labels";
import { BlueGridWidget } from "@/components/home/BlueGridWidget";
import { LabShowcase } from "@/components/home/LabShowcase";
import { TrackGrid, type TrackCardData } from "@/components/home/TrackGrid";
import { showcaseSamples } from "@/lib/licenseExam";

const TRACK_CARDS: TrackCardData[] = TRACKS.map((t) => ({
  slug: t.slug,
  title: t.title,
  audience: t.audience,
  description: t.description,
  image: t.image,
  tier: t.tier,
  topics: t.modules.flatMap((m) => m.lessons.map((l) => l.title)).slice(0, 3),
  moduleCount: t.modules.length,
  lessonCount: t.modules.reduce((n, m) => n + m.lessons.length, 0),
}));

export default function HomePage() {
  const articles = listArticles().slice(0, 2);
  return (
    <div className="space-y-16 lg:space-y-20">
      <section className="relative isolate overflow-hidden rounded-3xl bg-brand-950 px-5 py-10 text-white sm:px-10 sm:py-14 lg:py-16">
        <Image
          src="/images/hero-substation.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="-z-20 object-cover object-left"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-brand-950 via-brand-950/85 to-brand-950/40" />
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 space-y-6 lg:col-span-5">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-spark-400/40 bg-spark-400/15 px-3.5 py-1.5 text-xs font-extrabold text-spark-300 sm:text-sm">
              <span aria-hidden className="size-2 rounded-full bg-spark-400" />
              מאפס למומחיות ·{" "}
              <span dir="ltr" className="font-mono font-semibold">
                From Zero to Hero
              </span>
            </span>
            <h1 className="text-4xl leading-[1.15] font-black tracking-tight drop-shadow-lg sm:text-5xl">
              לומדים חשמל, <span className="underline decoration-spark-400 decoration-4 underline-offset-8">מהנורה הראשונה</span> ועד תחנת
              הכוח.
            </h1>
            <p className="text-lg leading-relaxed text-brand-100">
              מסלולי לימוד מובנים, סימולטורים אינטראקטיביים, מחשבונים מקצועיים והכנה לבחינות הרישוי. במקום אחד, ובעברית.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tracks/basics"
                className="flex items-center gap-2 rounded-2xl border border-spark-300 bg-spark-400 px-6 py-3.5 text-base font-black text-slate-950 shadow-lg shadow-spark-500/25 transition-colors hover:bg-spark-300"
              >
                מתחילים מאפס
                <ChevronLeft className="size-5" aria-hidden />
              </Link>
              <Link
                href="/tracks"
                className="rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                לכל המסלולים
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-5">
              <Metric value={`${TRACKS.length} מסלולים`} label="ממתחילים ועד מהנדסים" />
              <Metric value="22/0.4kV" label="סימולציות חיות" tone="text-sky-300" ltr />
              <Metric value="תשי״ד-1954" label="לפי חוק החשמל ותקנותיו" tone="text-spark-300" />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-7">
            <BlueGridWidget />
          </div>
        </div>
      </section>

      <section id="tracks" className="scroll-mt-20">
        <TrackGrid tracks={TRACK_CARDS} />
      </section>

      <LabShowcase licensing={showcaseSamples()} />

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                מגזין מקצועי
              </span>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">מאמרים ומדריכי שטח</h2>
            </div>
            <Link href="/articles" className="flex items-center gap-1 text-sm font-extrabold text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-spark-300">
              לכל המאמרים
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </div>
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="group block rounded-2xl border-2 border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-spark-400"
            >
              <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <time dateTime={a.date}>{formatDate(a.date)}</time>
                <span aria-hidden>·</span>
                <span>{a.author}</span>
              </p>
              <h3 className="text-xl font-black transition-colors group-hover:text-amber-600 dark:group-hover:text-spark-300">{a.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a.summary}</p>
              <p className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 text-xs font-extrabold text-amber-600 dark:border-slate-800 dark:text-spark-300">
                לקריאת המאמר
                <ChevronLeft className="size-4" aria-hidden />
              </p>
            </Link>
          ))}
          {articles.length === 0 && <p className="text-slate-500">מאמרים חדשים בדרך.</p>}
        </div>

        <Link href="/community" className="group relative isolate flex min-h-96 flex-col justify-end overflow-hidden rounded-2xl bg-[#0d1a4a] p-6 text-white lg:col-span-5">
          <Image
            src="/images/community.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="-z-20 object-cover object-top transition duration-500 group-hover:scale-105"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d1a4a] via-[#0d1a4a]/85 to-transparent" />
          <span className="mb-3 flex items-center gap-2.5">
            <span className="rounded-xl bg-slate-900 p-2 text-amber-400">
              <Users className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-bold text-brand-100">קהילת לומדים ואנשי מקצוע</span>
          </span>
          <h2 className="text-2xl font-black">שואלים, עונים, לומדים יחד</h2>
          <p className="mt-2 text-brand-100">מתלמידי בגרות ועד מהנדסי מערכות הספק: הארקות, הגנות, תכנון ושחזורי שאלות מוועדות הרישוי.</p>
          <span className="mt-5 block rounded-xl bg-spark-400 py-3 text-center text-sm font-extrabold text-slate-950 transition-colors group-hover:bg-spark-300">
            הצטרפות לקהילה (ללא עלות)
          </span>
        </Link>
      </section>
    </div>
  );
}

function Metric({ value, label, tone = "text-white", ltr = false }: { value: string; label: string; tone?: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur">
      <p dir={ltr ? "ltr" : undefined} className={`text-base font-extrabold sm:text-lg ${tone} ${ltr ? "text-end font-mono" : ""}`}>
        {value}
      </p>
      <p className="text-xs font-medium text-brand-100">{label}</p>
    </div>
  );
}
