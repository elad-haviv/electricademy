import type { Metadata } from "next";
import { Badge, Card, IconClock, IconFile, IconRuler, IconLayers } from "@electricademy/ui";
import { PageBanner } from "@/components/PageBanner";
import { WaitlistForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "סימולטור בחינות רישוי חשמלאים",
  description: "מבחני תרגול מתוזמנים, בנק שאלות לפי תקנות והסברים מלאים לקראת בחינות הרישוי.",
};

const FEATURES = [
  { Icon: IconClock, title: "מבחנים בתנאי אמת", text: "מבחנים מתוזמנים במבנה שמדמה את הבחינה." },
  { Icon: IconLayers, title: "בנק שאלות מתויג", text: "שאלות לפי נושא, תקנה ורמת רישיון, עם הסבר מלא לכל תשובה." },
  { Icon: IconFile, title: "מדד מוכנות", text: "מעקב אחרי נקודות חולשה, עם המלצות לשיעורים לחיזוק." },
  { Icon: IconRuler, title: "שרטוטים ותכניות", text: "תרגול קריאת תכניות חשמל ותרשימים חד־קויים." },
];

export default function LicenseExamPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageBanner
        title="סימולטור בחינות רישוי חשמלאים"
        subtitle="מתכוננים לבחינת הרישוי בביטחון: חשמלאי מעשי, מוסמך, הנדסאי ומהנדס."
        image="/images/license-exam.webp"
        eyebrow={
          <span>
            <Badge tone="pro">בקרוב</Badge>
          </span>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ Icon, title, text }) => (
          <Card key={title} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Icon className="size-5.5" />
            </span>
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-extrabold">רוצים להיות הראשונים לדעת?</h2>
        <p className="mt-1 mb-4 text-slate-600 dark:text-slate-400">השאירו אימייל ונעדכן ברגע שהסימולטור נפתח. בלי ספאם.</p>
        <WaitlistForm product="license-exam" />
      </Card>
    </div>
  );
}
