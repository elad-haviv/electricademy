import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card } from "@electricademy/ui";
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
  return (
    <div className="space-y-8">
      <header>
        <Link href="/tracks" className="text-sm text-brand-700 dark:text-brand-300">
          → כל המסלולים
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold">
          <span aria-hidden>{track.icon}</span> {track.title}
          {track.tier === "pro" && <Badge tone="pro">Pro</Badge>}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{track.description}</p>
      </header>
      {track.modules.map((m, mi) => (
        <Card key={m.slug}>
          <h2 className="text-xl font-bold">
            {mi + 1}. {m.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {m.lessons.map((l) => {
              const ready = hasLesson(track.slug, m.slug, l.slug);
              return (
                <li key={l.slug} className="flex items-center justify-between py-3">
                  {ready ? (
                    <Link href={`/tracks/${track.slug}/${m.slug}/${l.slug}`} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">
                      {l.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{l.title}</span>
                  )}
                  {!ready && <Badge>בקרוב</Badge>}
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
