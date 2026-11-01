import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Badge, IconLock, SectionHeading } from "@electricademy/ui";
import { can } from "@electricademy/auth";
import { VoltageDropCalculator } from "@/components/calculators/VoltageDropCalculator";
import { CableSizingCalculator } from "@/components/calculators/CableSizingCalculator";
import { ShortCircuitCalculator } from "@/components/calculators/ShortCircuitCalculator";
import { Paywall } from "@/components/Paywall";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "כלים ומחשבונים" };

const TOOLS = [
  { id: "voltage-drop", title: "מפל מתח", text: "כמה מתח הולך לאיבוד בכבל?" },
  { id: "cable-sizing", title: "בחירת חתך כבל", text: "איזה חתך מתאים לעומס ולאורך?" },
  { id: "short-circuit", title: "זרם קצר בהדקי שנאי", text: "ערך עליון לבדיקת כושר ניתוק.", pro: true },
];

export default async function ToolsPage() {
  const [access, user] = await Promise.all([getCurrentAccess(), getSessionUser()]);
  return (
    <div>
      <SectionHeading
        as="h1"
        title="כלים ומחשבונים"
        subtitle="מחשבונים לחשמלאים, מתכננים וסטודנטים. התוצאה מתעדכנת תוך כדי הקלדה, וכל חישוב מוסבר."
      />

      <nav aria-label="מחשבונים בעמוד" className="mb-10 grid gap-3 sm:grid-cols-3">
        {TOOLS.map((t, i) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-extrabold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-1.5 font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {t.title}
                {t.pro && <IconLock className="size-3.5 text-slate-500" title="Pro" />}
              </span>
              <span className="block text-sm text-slate-600 dark:text-slate-400">{t.text}</span>
            </span>
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        <ToolSection id="voltage-drop" title="מפל מתח" index={1}>
          <VoltageDropCalculator />
        </ToolSection>
        <ToolSection id="cable-sizing" title="בחירת חתך כבל" index={2}>
          <CableSizingCalculator />
        </ToolSection>
        <ToolSection id="short-circuit" title="זרם קצר בהדקי שנאי" index={3} badge={<Badge tone="pro">Pro</Badge>}>
          {can(access, "tools.professional") ? (
            <ShortCircuitCalculator />
          ) : (
            <Paywall title="מחשבון מקצועי למנויי Pro" loggedIn={Boolean(user)} />
          )}
        </ToolSection>
      </div>
    </div>
  );
}

function ToolSection({ id, title, index, badge, children }: { id: string; title: string; index: number; badge?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="mb-4 flex items-center gap-3 text-2xl font-extrabold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-base text-white">{index}</span>
        {title}
        {badge}
      </h2>
      {children}
    </section>
  );
}
