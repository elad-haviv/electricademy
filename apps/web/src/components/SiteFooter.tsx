import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-slate-200 py-10 text-sm text-slate-500 md:block dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <p>© {new Date().getFullYear()} Electricademy · לומדים חשמל, From Zero to Hero</p>
        <nav className="flex gap-4">
          <Link href="/products">מוצרים</Link>
          <Link href="/pricing">מחירים</Link>
          <Link href="/articles">מאמרים</Link>
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-6xl px-4 text-xs">
        התוכן באתר נועד ללימוד בלבד. עבודה במתקני חשמל מותרת רק לבעלי רישיון מתאים, בהתאם לחוק החשמל ולתקנותיו.
      </p>
    </footer>
  );
}
