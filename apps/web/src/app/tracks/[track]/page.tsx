import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, buttonClass, Card, IconArrowLeft, IconChevronLeft, IconClock, IconLayers, IconBook } from "@electricademy/ui";
import { Crumbs } from "@/components/Crumbs";
import { PageBanner } from "@/components/PageBanner";
import { getTrack, hasLesson, TRACKS } from "@electricademy/content";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const track = getTrack((await params).track);
  return { title: track?.title };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const track = getTrack((await params).track);
  if (!track) notFound();

  const lessons = track.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, module: m.slug, ready: hasLesson(track.slug, m.slug, l.slug) })),
  );
  const first = lessons.find((l) => l.ready);
  const readyCount = lessons.filter((l) => l.ready).length;

  return (
    <div>
      <Crumbs items={[{ label: "מסלולים", href: "/tracks" }, { label: track.title }]} />
      <PageBanner
        title={track.title}
        subtitle={track.description}
        image={track.image}
        eyebrow={
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-brand-200">
            {track.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
            {track.audience}
          </span>
        }
      >
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-100">
          <li className="flex items-center gap-1.5">
            <IconLayers className="size-4" />
            {track.modules.length} מודולים
          </li>
          <li className="flex items-center gap-1.5">
            <IconBook className="size-4" />
            {lessons.length} שיעורים
          </li>
          {readyCount < lessons.length && (
            <li className="flex items-center gap-1.5">
              <IconClock className="size-4" />
              {readyCount} זמינים כעת
            </li>
          )}
        </ul>
        {first && (
          <Link href={`/tracks/${track.slug}/${first.module}/${first.slug}`} className={buttonClass("spark", "mt-3 self-start", "lg")}>
            להתחיל מהשיעור הראשון
            <IconArrowLeft className="size-5" />
          </Link>
        )}
      </PageBanner>

      <div className="space-y-6">
        {track.modules.map((m, mi) => (
          <Card key={m.slug} id={m.slug} className="scroll-mt-24 p-0 sm:p-0">
            <div className="flex gap-4 p-5 sm:p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">
                {mi + 1}
              </span>
              <div>
                <h2 className="text-xl font-extrabold">{m.title}</h2>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">{m.description}</p>
              </div>
            </div>
            <ol className="border-t border-slate-100 dark:border-slate-800">
              {m.lessons.map((l, li) => {
                const ready = hasLesson(track.slug, m.slug, l.slug);
                const number = (
                  <span className="w-8 shrink-0 text-center text-sm font-bold text-slate-400 tabular-nums">
                    {mi + 1}.{li + 1}
                  </span>
                );
                return (
                  <li key={l.slug} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    {ready ? (
                      <Link
                        href={`/tracks/${track.slug}/${m.slug}/${l.slug}`}
                        className="group flex min-h-14 items-center gap-3 px-5 py-3 font-semibold transition hover:bg-brand-50 sm:px-6 dark:hover:bg-slate-800/60"
                      >
                        {number}
                        <span className="flex-1 group-hover:text-brand-700 dark:group-hover:text-brand-300">{l.title}</span>
                        <IconChevronLeft className="size-5 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-brand-600" />
                      </Link>
                    ) : (
                      <div className="flex min-h-14 items-center gap-3 px-5 py-3 text-slate-500 sm:px-6 dark:text-slate-400">
                        {number}
                        <span className="flex-1">{l.title}</span>
                        <Badge>בקרוב</Badge>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
