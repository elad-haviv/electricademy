"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@electricademy/ui";
import { NAV_ITEMS } from "./nav";

/** Mobile-only tab bar. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="ניווט תחתון"
      data-site-chrome
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <ul className="grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400",
                )}
              >
                <span aria-hidden className="text-lg leading-6">
                  {item.icon}
                </span>
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
