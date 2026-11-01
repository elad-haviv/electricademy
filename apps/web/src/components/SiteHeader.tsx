import Link from "next/link";
import { buttonClass } from "@electricademy/ui";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/actions";
import { NAV_ITEMS } from "./nav";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const session = await auth().catch(() => null);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="ניווט ראשי">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={buttonClass("ghost")}>
              {item.label}
            </Link>
          ))}
          <Link href="/products" className={buttonClass("ghost")}>
            מוצרים
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/dashboard" className={buttonClass("secondary")}>
                האזור שלי
              </Link>
              <form action={signOutAction} className="hidden sm:block">
                <button className={buttonClass("ghost")}>יציאה</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/pricing" className={buttonClass("ghost", "hidden sm:inline-flex")}>
                מחירים
              </Link>
              <Link href="/login" className={buttonClass("primary")}>
                התחברות
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
