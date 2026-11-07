import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Badge, buttonClass, Card } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { can } from "@electricademy/auth";
import { getDb, simulators } from "@electricademy/db";
import { LEVEL_LABELS } from "@/lib/labels";
import { getCurrentAccess } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "סימולטורים" };

export default async function SimulatorsPage() {
  const [rows, access] = await Promise.all([
    getDb().select().from(simulators).orderBy(asc(simulators.sortOrder)),
    getCurrentAccess(),
  ]);
  return (
    <>
      <PageBanner title="סימולטורים ולומדות" subtitle="לומדים בידיים: מודלים בתלת־ממד, תרגילי נוהל ותרחישי תקלות." image="/images/simulators.webp" />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((s) => {
          const unlocked = s.tier === "free" || can(access, "simulators.pro");
          return (
            <Card key={s.slug} className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{s.name}</h2>
                {s.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                <Badge>{LEVEL_LABELS[s.level] ?? s.level}</Badge>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>
              <div className="mt-4">
                {unlocked ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/simulators/${s.slug}`} className={buttonClass("primary")}>
                      כניסה לסימולטור
                    </Link>
                    <a href={s.url} target="_blank" rel="noopener" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
                      בלשונית חדשה ↗
                    </a>
                  </div>
                ) : (
                  <Link href={`/simulators/${s.slug}`} className={buttonClass("secondary")}>
                    🔒 זמין ב־Pro
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {rows.length === 0 && <p className="text-slate-500">עדיין אין סימולטורים. יש להריץ את סקריפט ה־seed.</p>}
    </>
  );
}
