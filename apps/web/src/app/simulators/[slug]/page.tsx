import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, buttonClass, Card } from "@electricademy/ui";
import { Paywall } from "@/components/Paywall";
import { SimFrame } from "@/components/SimFrame";
import { LEVEL_LABELS } from "@/lib/labels";
import { getCurrentAccess, getSessionUser } from "@/lib/session";
import { canUseSimulator, getSimulator, simulatorOrigin } from "@/lib/simulators";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const sim = await getSimulator((await params).slug);
  return { title: sim?.name ?? "סימולטור", description: sim?.description };
}

export default async function SimulatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const sim = await getSimulator((await params).slug);
  if (!sim) notFound();
  const [access, user] = await Promise.all([getCurrentAccess(), getSessionUser()]);
  const unlocked = canUseSimulator(sim, access);
  const origin = simulatorOrigin(sim);

  return (
    <div className="space-y-4">
      <Link href="/simulators" className="text-sm text-brand-700 dark:text-brand-300">
        → כל הסימולטורים
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{sim.name}</h1>
            {sim.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
            <Badge>{LEVEL_LABELS[sim.level] ?? sim.level}</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{sim.description}</p>
        </div>
      </header>

      {!unlocked ? (
        <Paywall title={`${sim.name} זמין ב־Pro`} loggedIn={Boolean(user)} />
      ) : sim.embeddable && origin ? (
        <SimFrame slug={sim.slug} name={sim.name} url={sim.url} origin={origin} loggedIn={Boolean(user)} />
      ) : (
        <Card className="flex flex-col items-start gap-3">
          <p>הסימולטור הזה נפתח באתר משלו.</p>
          <a href={sim.url} target="_blank" rel="noopener" className={buttonClass("primary")}>
            פתיחת הסימולטור ↗
          </a>
        </Card>
      )}
    </div>
  );
}
