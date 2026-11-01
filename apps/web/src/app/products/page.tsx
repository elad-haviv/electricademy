import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Badge, buttonClass, Card, SectionHeading } from "@electricademy/ui";
import { getDb, products } from "@electricademy/db";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "מוצרים" };

const STATUS = { live: { label: "זמין", tone: "success" }, beta: { label: "בטא", tone: "brand" }, coming_soon: { label: "בקרוב", tone: "pro" } } as const;

export default async function ProductsPage() {
  const rows = await getDb().select().from(products).orderBy(asc(products.sortOrder));
  return (
    <>
      <SectionHeading title="המוצרים שלנו" subtitle="כלים מקצועיים מבית Electricademy." />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.slug} id={p.slug} className="flex scroll-mt-24 flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
            </div>
            <p className="mt-1 font-medium text-brand-700 dark:text-brand-300">{p.tagline}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
            <div className="mt-4">
              {p.slug === "license-exam" ? (
                <Link href="/license-exam" className={buttonClass("primary")}>
                  לרשימת ההמתנה
                </Link>
              ) : p.url ? (
                <a href={p.url} target="_blank" rel="noopener" className={buttonClass("primary")}>
                  למוצר ↗
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
