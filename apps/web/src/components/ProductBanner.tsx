import Link from "next/link";
import { inArray } from "drizzle-orm";
import { getDb, products } from "@electricademy/db";
import { IconArrowLeft, IconPackage } from "@electricademy/ui";

/** Contextual promotion of our products inside lessons/articles. */
export async function ProductBanner({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  const rows = await getDb().select().from(products).where(inArray(products.slug, slugs)).catch(() => []);
  if (rows.length === 0) return null;
  return (
    <div className="mt-12 space-y-3">
      {rows.map((p) => (
        <Link
          key={p.slug}
          href={p.slug === "license-exam" ? "/license-exam" : `/products#${p.slug}`}
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-800 p-5 text-white shadow-sm transition hover:shadow-(--shadow-raised)"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <IconPackage className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold text-brand-100">מבית Electricademy</span>
            <span className="block text-lg font-bold">{p.name}</span>
            <span className="block text-sm text-brand-100">{p.tagline}</span>
          </span>
          <IconArrowLeft className="size-5 shrink-0 transition group-hover:-translate-x-1" />
        </Link>
      ))}
    </div>
  );
}
