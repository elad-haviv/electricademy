import type { Metadata } from "next";
import { PRICING } from "@electricademy/auth";
import { Badge, Button, Card, IconCheck, Notice, SectionHeading } from "@electricademy/ui";
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
      <SectionHeading as="h1" title="מחירים פשוטים" subtitle="מתחילים בחינם, בלי כרטיס אשראי. משדרגים כשרוצים להעמיק." />
      {checkout === "unavailable" && (
        <Notice tone="warning" className="mb-6">
          הסליקה עדיין לא פעילה. אנחנו בשלב ההשקה, ונעדכן כשמנויי Pro ייפתחו.
        </Notice>
      )}
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <Card className="flex flex-col p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">חינם</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">כל מה שצריך כדי להתחיל ללמוד.</p>
          <p className="mt-5 text-4xl font-extrabold tabular-nums">₪0</p>
          <FeatureList items={FREE} />
        </Card>
        <Card className="relative flex flex-col p-6 ring-2 ring-brand-500 sm:p-8 dark:ring-brand-500">
          <Badge tone="pro" className="absolute -top-3 start-6 shadow-sm">
            הכי משתלם
          </Badge>
          <h2 className="text-xl font-extrabold">Pro</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">לומדים לעומק, מתרגלים לבחינות.</p>
          <p className="mt-5 text-4xl font-extrabold tabular-nums">
            ₪{monthly.priceIls}
            <span className="text-base font-medium text-slate-600 dark:text-slate-400"> / חודש</span>
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            או ₪{yearly.priceIls} לשנה
            {yearly.priceIls < monthly.priceIls * 12 && (
              <span className="ms-1 font-bold text-emerald-700 dark:text-emerald-400">
                (חיסכון של ₪{monthly.priceIls * 12 - yearly.priceIls})
              </span>
            )}
          </p>
          <FeatureList items={PRO} />
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            <form action={startCheckout}>
              <input type="hidden" name="sku" value="pro_yearly" />
              <Button className="w-full">מנוי שנתי</Button>
            </form>
            <form action={startCheckout}>
              <input type="hidden" name="sku" value="pro_monthly" />
              <Button variant="secondary" className="w-full">
                מנוי חודשי
              </Button>
            </form>
          </div>
        </Card>
      </div>
      <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-slate-600 dark:text-slate-400">
        מוצרים כמו סימולטור בחינות הרישוי ו־Blue Grid נמכרים בנפרד. המחירים להמחשה ויעודכנו לקראת ההשקה.
      </p>
    </>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex-1 space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <IconCheck className="size-3.5" strokeWidth={3} />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}
