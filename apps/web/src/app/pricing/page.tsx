import type { Metadata } from "next";
import { PRICING } from "@electricademy/auth";
import { Badge, Button, Card, SectionHeading } from "@electricademy/ui";
import { startCheckout } from "@/lib/actions";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "מחירים" };

const FREE = ["מסלול יסודות ומסלול בגרות", "מאמרים וחדשות", "השתתפות בקהילה", "מחשבוני בסיס", "סימולטורים פתוחים"];
const PRO = ["כל מה שיש בחינם", "מסלולי הנדסאים, תואר ואנשי מקצוע", "מבחני תרגול ובנק שאלות", "מחשבונים מקצועיים", "כל הסימולטורים"];

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const monthly = PRICING.find((p) => p.sku === "pro_monthly")!;
  const yearly = PRICING.find((p) => p.sku === "pro_yearly")!;
  return (
    <>
      <SectionHeading level={1} title="מחירים" subtitle="מתחילים בחינם. משדרגים כשרוצים להעמיק." />
      {checkout === "unavailable" && (
        <p role="status" className="mb-6 rounded-xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          הסליקה עדיין לא פעילה. אנחנו בשלב ההשקה, ונעדכן כשמנויי Pro ייפתחו.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">חינם</h2>
          <p className="mt-1 text-3xl font-extrabold">₪0</p>
          <ul className="mt-4 space-y-2 text-sm">
            {FREE.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        </Card>
        <Card className="ring-2 ring-brand-500">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Pro</h2>
            <Badge tone="pro">מומלץ</Badge>
          </div>
          <p className="mt-1 text-3xl font-extrabold">
            ₪{monthly.priceIls}
            <span className="text-base font-medium text-slate-500 dark:text-slate-400"> / חודש</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">או ₪{yearly.priceIls} לשנה</p>
          <ul className="mt-4 space-y-2 text-sm">
            {PRO.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
          <div className="mt-6 flex gap-2">
            <form action={startCheckout}>
              <input type="hidden" name="sku" value="pro_monthly" />
              <Button>מנוי חודשי</Button>
            </form>
            <form action={startCheckout}>
              <input type="hidden" name="sku" value="pro_yearly" />
              <Button variant="secondary">מנוי שנתי</Button>
            </form>
          </div>
        </Card>
      </div>
      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        מוצרים כמו סימולטור בחינות הרישוי ו־Blue Grid נמכרים בנפרד. המחירים להמחשה ויעודכנו לקראת ההשקה.
      </p>
    </>
  );
}
