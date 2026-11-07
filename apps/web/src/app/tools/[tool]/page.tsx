import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@electricademy/ui";
import { can } from "@electricademy/auth";
import { CableSizingCalculator } from "@/components/calculators/CableSizingCalculator";
import { ShortCircuitCalculator } from "@/components/calculators/ShortCircuitCalculator";
import { VoltageDropCalculator } from "@/components/calculators/VoltageDropCalculator";
import { Paywall } from "@/components/Paywall";
import { getCurrentAccess, getSessionUser } from "@/lib/session";
import { getTool, type ToolSlug } from "@/lib/tools";

// Reads the session on every request (Pro tools are gated).
export const dynamic = "force-dynamic";

const CALCULATORS: Record<ToolSlug, React.ComponentType> = {
  "cable-selection": CableSizingCalculator,
  "voltage-drop": VoltageDropCalculator,
  "transformer-short-circuit": ShortCircuitCalculator,
};

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const entry = getTool((await params).tool);
  return { title: entry?.tool.title, description: entry?.tool.description };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const entry = getTool((await params).tool);
  if (!entry) notFound();
  const { tool, category } = entry;
  const Calculator = CALCULATORS[tool.slug];

  let unlocked = true;
  let loggedIn = false;
  if (tool.tier === "pro") {
    const [access, user] = await Promise.all([getCurrentAccess(), getSessionUser()]);
    unlocked = can(access, "tools.professional");
    loggedIn = Boolean(user);
  }

  return (
    <div className="space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/tools">כלים</Link>
        <span className="mx-2 text-slate-400">/</span>
        <Link href={`/tools#${category.slug}`}>{category.title}</Link>
      </nav>
      <header>
        <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold tracking-tight">
          <span aria-hidden>{tool.icon}</span>
          {tool.title}
          {tool.tier === "pro" && <Badge tone="pro">Pro</Badge>}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{tool.description}</p>
      </header>
      {unlocked ? <Calculator /> : <Paywall title="מחשבון מקצועי למנויי Pro" loggedIn={loggedIn} />}
    </div>
  );
}
