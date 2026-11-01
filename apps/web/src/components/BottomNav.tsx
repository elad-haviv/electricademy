"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@electricademy/ui";
import { isActive, MOBILE_NAV_ITEMS } from "./nav";

/** Mobile-only tab bar, within thumb reach. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="ניווט תחתון"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {MOBILE_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                  active ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-brand-100 dark:bg-brand-950" : "group-active:bg-slate-100 dark:group-active:bg-slate-800",
                  )}
                >
                  <Icon className="size-5.5" strokeWidth={active ? 2.25 : 1.9} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
