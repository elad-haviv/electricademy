import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@electricademy/ui";
import { TOOL_CATEGORIES } from "@/lib/tools";

export const metadata: Metadata = { title: "כלים ומחשבונים" };

export default function ToolsCatalogPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">כלים ומחשבונים</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          קטלוג מחשבונים לחשמלאים, מתכננים וסטודנטים, מסודר לפי קטגוריות. כל החישובים שקופים ומוסברים.
        </p>
      </header>
      {TOOL_CATEGORIES.map((category) => (
        <section key={category.slug} id={category.slug} aria-labelledby={`cat-${category.slug}`} className="scroll-mt-24">
          <div className="mb-4">
            <h2 id={`cat-${category.slug}`} className="flex items-center gap-2 text-2xl font-bold">
              <span aria-hidden>{category.icon}</span>
              {category.title}
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{category.description}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.tools.map((tool) => (
              <li key={tool.slug}>
                <Link href={`/tools/${tool.slug}`} className="group block h-full rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
                  <Card className="flex h-full flex-col transition group-hover:ring-brand-400 dark:group-hover:ring-brand-600">
                    <div className="flex items-start justify-between gap-2">
                      <span aria-hidden className="text-3xl">
                        {tool.icon}
                      </span>
                      {tool.tier === "pro" ? <Badge tone="pro">Pro</Badge> : <Badge tone="success">חינם</Badge>}
                    </div>
                    <h3 className="mt-3 text-lg font-bold">{tool.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
                    <span className="mt-4 text-sm font-semibold text-brand-700 dark:text-brand-300">לפתיחת הכלי ←</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
