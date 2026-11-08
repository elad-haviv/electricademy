import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import "@fontsource-variable/jetbrains-mono";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ConsentManager } from "@/components/consent/ConsentManager";

export const metadata: Metadata = {
  title: { default: "Electricademy – לומדים חשמל מאפס ועד מומחיות", template: "%s · Electricademy" },
  description:
    "קהילת הלמידה של עולם החשמל: יסודות, בגרות, הנדסאים, תואר ובחינות רישוי. כולל סימולטורים, מחשבונים, מאמרים וקהילה.",
  applicationName: "Electricademy",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh font-sans">
        {/* WCAG 2.4.1: the first focusable element skips the header's navigation */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-3 focus:font-bold focus:text-white focus:shadow-lg focus:outline-spark-400 dark:focus:bg-white dark:focus:text-slate-900 dark:focus:outline-brand-600"
        >
          דילוג לתוכן הראשי
        </a>
        <ConsentManager />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pt-6 pb-10 outline-none md:pb-16">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
