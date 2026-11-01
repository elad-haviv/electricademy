import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "לומדים",
    links: [
      { href: "/tracks", label: "מסלולי לימוד" },
      { href: "/tracks/basics", label: "מתחילים מאפס" },
      { href: "/license-exam", label: "בחינות רישוי" },
      { href: "/articles", label: "מאמרים וחדשות" },
    ],
  },
  {
    title: "מתרגלים",
    links: [
      { href: "/simulators", label: "סימולטורים" },
      { href: "/tools", label: "מחשבונים" },
      { href: "/community", label: "קהילה" },
    ],
  },
  {
    title: "Electricademy",
    links: [
      { href: "/products", label: "מוצרים" },
      { href: "/pricing", label: "מחירים" },
      { href: "/articles/rss.xml", label: "RSS" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-10 pb-28 text-sm text-slate-600 md:pb-10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
        <div className="col-span-2 space-y-3 md:col-span-1">
          <Logo />
          <p className="max-w-xs">לומדים חשמל, מהנורה הראשונה ועד תחנת הכוח.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="last:col-span-2 md:last:col-span-1">
            <h2 className="mb-2 font-bold text-slate-900 dark:text-white">{col.title}</h2>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1 hover:text-brand-700 hover:underline dark:hover:text-brand-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-slate-200 px-4 pt-6 text-xs leading-6 dark:border-slate-800">
        <p>
          © {new Date().getFullYear()} Electricademy. התוכן באתר נועד ללימוד בלבד. עבודה במתקני חשמל מותרת רק לבעלי רישיון מתאים, בהתאם
          לחוק החשמל ולתקנותיו.
        </p>
      </div>
    </footer>
  );
}
