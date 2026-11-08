import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { BrandEmblem } from "./home/EngineeringIcons";
import { LegalLinks } from "./consent/LegalLinks";

const COLUMNS = [
  {
    title: "מסלולי לימוד",
    links: [
      { href: "/tracks/basics", label: "יסודות החשמל (חינם)" },
      { href: "/tracks/bagrut", label: "בגרות בחשמל" },
      { href: "/tracks/technician", label: "טכנאי והנדסאי חשמל" },
      { href: "/tracks/academic", label: "הנדסת חשמל (תואר)" },
    ],
  },
  {
    title: "מעבדה וכלים",
    links: [
      { href: "/simulators", label: "סימולטורים" },
      { href: "/tools", label: "מחשבונים" },
      { href: "/license-exam", label: "סימולטור בחינות רישוי" },
      { href: "/law", label: "חוק החשמל ותקנותיו" },
      { href: "/products", label: "מוצרים" },
    ],
  },
  {
    title: "קהילה ותוכן",
    links: [
      { href: "/community", label: "קהילה" },
      { href: "/articles", label: "מאמרים" },
      { href: "/pricing", label: "מחירים" },
      { href: "/tracks/licensing", label: "בחינות רישוי" },
    ],
  },
];

/** On phones the full footer gives way to the tab bar, so a slim row keeps the legal links (accessibility statement, privacy, cookies) on every page. */
export function SiteFooter() {
  return (
    <footer data-site-chrome className="on-dark border-t border-slate-800 bg-slate-900 text-slate-300 md:pt-14 md:pb-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-xs md:hidden">
        <LegalLinks variant="footer" />
        <p className="text-slate-400">© {new Date().getFullYear()} Electricademy</p>
      </div>
      <div className="mx-auto hidden max-w-6xl px-4 md:block">
        <div className="grid gap-8 border-b border-slate-800 pb-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-3">
              <BrandEmblem className="size-10" />
              <div>
                <span className="text-xl font-black text-white">Electricademy</span>
                <span className="block text-xs font-bold text-spark-400">לומדים חשמל, מאפס ועד מומחיות</span>
              </div>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              פלטפורמת לימוד וקהילה לעולם החשמל: יסודות, בגרות, הנדסאים, תואר, בחינות רישוי וכלים לאנשי מקצוע.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 text-xs font-extrabold tracking-wider text-white">{col.title}</h2>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-spark-400 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs leading-relaxed text-slate-400 sm:flex-row sm:items-center">
          <p className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-spark-400" aria-hidden />
            <span>
              <strong className="text-slate-200">הבהרה:</strong> התכנים, הסימולטורים והמחשבונים באתר נועדו ללימוד בלבד. עבודה במתקני חשמל מותרת רק
              לבעלי רישיון מתאים ובתוקף, בהתאם ל<strong className="text-spark-400">חוק החשמל, התשי״ד-1954</strong> ולתקנותיו.
            </span>
          </p>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <LegalLinks variant="footer" />
            <p className="font-semibold whitespace-nowrap text-slate-400">
              © {new Date().getFullYear()} Electricademy · From Zero to Hero
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
