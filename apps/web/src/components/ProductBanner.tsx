import Link from "next/link";
import { inArray } from "drizzle-orm";
import { getDb, products } from "@electricademy/db";

/** Contextual promotion of our products inside lessons/articles. */
export async function ProductBanner({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  const rows = await getDb().select().from(products).where(inArray(products.slug, slugs)).catch(() => []);
  if (rows.length === 0) return null;
  return (
    <div className="mt-10 space-y-3">
      {rows.map((p) => (
        <Link
          key={p.slug}
          href={p.slug === "license-exam" ? "/license-exam" : `/products#${p.slug}`}
          className="flex items-center gap-4 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-800 p-5 text-white shadow-sm transition hover:shadow-md"
        >
          <span className="text-3xl" aria-hidden>
            🔌
          </span>
          <span>
            <span className="block text-xs font-semibold text-brand-100">מבית Electricademy</span>
            <span className="block text-lg font-bold">{p.name}</span>
            <span className="block text-sm text-brand-100">{p.tagline}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
