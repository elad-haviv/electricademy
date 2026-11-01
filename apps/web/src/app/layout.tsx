import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";

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
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-3"
        >
          דילוג לתוכן הראשי
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 outline-none sm:pt-8">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
