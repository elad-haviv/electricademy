"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@electricademy/ui";
import { isActive, NAV_ITEMS } from "./nav";

/** Desktop primary navigation with a visible "you are here" indicator. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden flex-1 md:block" aria-label="ניווט ראשי">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-10 items-center rounded-lg px-3 text-[0.95rem] font-semibold transition-colors",
                  active
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                {label}
                {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
