import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, IconChevronLeft } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { TRACKS } from "@electricademy/content";

export const metadata: Metadata = { title: "מסלולי לימוד" };

export default function TracksPage() {
  return (
    <>
      <PageBanner
        title="מסלולי לימוד"
        subtitle="From Zero to Hero: מהיסודות ועד מערכות הספק ובחינות רישוי. אפשר להתחיל בכל שלב."
        image="/images/tracks/academic.webp"
      />
      <ol className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t, i) => {
          const lessons = t.modules.reduce((n, m) => n + m.lessons.length, 0);
          return (
            <li key={t.slug}>
              <Link href={`/tracks/${t.slug}`} className="group block h-full rounded-(--radius-card) outline-none">
                <Card interactive className="flex h-full items-stretch gap-4 p-3 sm:p-4">
                  <span className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-navy-900 sm:w-32">
                    <Image src={t.image} alt="" fill sizes="128px" className="object-cover transition duration-500 group-hover:scale-105" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">שלב {i + 1}</span>
                      {t.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                    </div>
                    <h2 className="mt-1 text-lg leading-snug font-extrabold group-hover:text-brand-700 dark:group-hover:text-brand-300">
                      {t.title}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
                    <p className="mt-auto pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.audience} · {t.modules.length} מודולים · {lessons} שיעורים
                    </p>
                  </div>
                  <IconChevronLeft className="size-5 shrink-0 self-center text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-brand-600" />
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
