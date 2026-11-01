import type { Metadata } from "next";
import { Badge, Card } from "@electricademy/ui";
import { WaitlistForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "סימולטור בחינות רישוי חשמלאים",
  description: "מבחני תרגול מתוזמנים, בנק שאלות לפי תקנות והסברים מלאים לקראת בחינות הרישוי.",
};

const FEATURES = [
  { icon: "⏱️", title: "מבחנים בתנאי אמת", text: "מבחנים מתוזמנים במבנה שמדמה את הבחינה." },
  { icon: "🗂️", title: "בנק שאלות מתויג", text: "שאלות לפי נושא, תקנה ורמת רישיון, עם הסבר מלא לכל תשובה." },
  { icon: "📈", title: "מדד מוכנות", text: "מעקב אחרי נקודות חולשה, עם המלצות לשיעורים לחיזוק." },
  { icon: "📐", title: "שרטוטים ותכניות", text: "תרגול קריאת תכניות חשמל ותרשימים חד־קויים." },
];

export default function LicenseExamPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <Badge tone="pro">בקרוב</Badge>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">סימולטור בחינות רישוי חשמלאים</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          מתכוננים לבחינת הרישוי בביטחון: חשמלאי מעשי, מוסמך, הנדסאי ומהנדס.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <p className="text-2xl" aria-hidden>
              {f.icon}
            </p>
            <h2 className="mt-2 font-bold">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-bold">רוצים להיות הראשונים לדעת?</h2>
        <WaitlistForm product="license-exam" />
      </Card>
    </div>
  );
}
