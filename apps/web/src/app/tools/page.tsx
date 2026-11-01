import type { Metadata } from "next";
import { Badge, SectionHeading } from "@electricademy/ui";
import { can } from "@electricademy/auth";
import { VoltageDropCalculator } from "@/components/calculators/VoltageDropCalculator";
import { CableSizingCalculator } from "@/components/calculators/CableSizingCalculator";
import { ShortCircuitCalculator } from "@/components/calculators/ShortCircuitCalculator";
import { Paywall } from "@/components/Paywall";
import { getCurrentAccess, getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "כלים ומחשבונים" };

export default async function ToolsPage() {
  const [access, user] = await Promise.all([getCurrentAccess(), getSessionUser()]);
  return (
    <div className="space-y-12">
      <SectionHeading title="כלים ומחשבונים" subtitle="מחשבונים לחשמלאים, מתכננים וסטודנטים. כל החישובים שקופים ומוסברים." />
      <section id="voltage-drop">
        <h2 className="mb-3 text-xl font-bold">מפל מתח</h2>
        <VoltageDropCalculator />
      </section>
      <section id="cable-sizing">
        <h2 className="mb-3 text-xl font-bold">בחירת חתך כבל</h2>
        <CableSizingCalculator />
      </section>
      <section id="short-circuit">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          זרם קצר בהדקי שנאי <Badge tone="pro">Pro</Badge>
        </h2>
        {can(access, "tools.professional") ? (
          <ShortCircuitCalculator />
        ) : (
          <Paywall title="מחשבון מקצועי למנויי Pro" loggedIn={Boolean(user)} />
        )}
      </section>
    </div>
  );
}
