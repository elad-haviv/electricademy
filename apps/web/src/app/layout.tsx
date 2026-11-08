import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import "@fontsource-variable/jetbrains-mono";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { LegalLinks } from "@/components/consent/LegalLinks";

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
        <ConsentManager />
        <SiteHeader />
        <main tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 outline-none md:pb-16">
          {children}
        </main>
        <LegalLinks variant="mobile" />
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
