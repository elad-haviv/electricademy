import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@electricademy/ui";

/** Breadcrumbs wired to Next.js links. Every trail starts at Home. */
export function Crumbs({ items, className }: { items: { label: ReactNode; href?: string }[]; className?: string }) {
  return (
    <Breadcrumbs
      className={className}
      items={[{ label: "בית", href: "/" }, ...items]}
      renderLink={(href, label, cls) => (
        <Link href={href} className={cls}>
          {label}
        </Link>
      )}
    />
  );
}
