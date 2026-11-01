import Link from "next/link";
import { buttonClass, IconLogOut, IconUser } from "@electricademy/ui";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/actions";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export async function SiteHeader() {
  const session = await auth().catch(() => null);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 dark:border-slate-800 dark:bg-slate-950/90 dark:supports-[backdrop-filter]:bg-slate-950/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:gap-8">
        <Logo />
        <NavLinks />
        <div className="ms-auto flex items-center gap-1.5">
          {session?.user ? (
            <>
              <Link href="/dashboard" className={buttonClass("secondary", undefined, "sm")}>
                <IconUser className="size-4" />
                האזור שלי
              </Link>
              <form action={signOutAction}>
                <button className={buttonClass("ghost", "px-2.5", "sm")} aria-label="יציאה מהחשבון" title="יציאה">
                  <IconLogOut className="size-4.5" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/pricing" className={buttonClass("ghost", "hidden sm:inline-flex", "sm")}>
                מחירים
              </Link>
              <Link href="/login" className={buttonClass("primary", undefined, "sm")}>
                התחברות
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
