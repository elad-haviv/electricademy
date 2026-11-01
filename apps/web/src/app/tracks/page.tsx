import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { TRACKS } from "@electricademy/content";

export const metadata: Metadata = { title: "מסלולי לימוד" };

export default function TracksPage() {
  return (
    <>
      <PageBanner title="מסלולי לימוד" subtitle="From Zero to Hero: מהיסודות ועד מערכות הספק ובחינות רישוי." image="/images/tracks/academic.webp" />
      <ol className="space-y-4">
        {TRACKS.map((t, i) => (
          <li key={t.slug}>
            <Link href={`/tracks/${t.slug}`}>
              <Card className="flex items-start gap-4 transition hover:ring-brand-400">
                <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-[#0d1a4a] sm:w-32">
                  <Image src={t.image} alt="" fill sizes="128px" className="object-cover" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">שלב {i + 1}</span>
                    <h2 className="text-lg font-bold">{t.title}</h2>
                    {t.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.modules.length} מודולים · {t.modules.reduce((n, m) => n + m.lessons.length, 0)} שיעורים · {t.audience}
                  </p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
