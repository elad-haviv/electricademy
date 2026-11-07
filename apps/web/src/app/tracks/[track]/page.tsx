import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { LawCallout } from "@/components/law/LawCallout";
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
    <div className="space-y-6">
      <Link href="/tracks" className="text-sm text-brand-700 dark:text-brand-300">
        → כל המסלולים
      </Link>
      <PageBanner
        title={track.title}
        subtitle={track.description}
        image={track.image}
        eyebrow={
          <span className="flex items-center gap-2 text-sm text-brand-200">
            {track.audience}
            {track.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
          </span>
        }
      />
      {(track.slug === "licensing" || track.slug === "professionals") && <LawCallout />}
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
