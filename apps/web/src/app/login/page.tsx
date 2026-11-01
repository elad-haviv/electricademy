import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button, Card, inputClass, labelClass, Notice } from "@electricademy/ui";
import { Logo } from "@/components/Logo";
import { enabledProviders } from "@/auth";
import { signInWith } from "@/lib/actions";
import { getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "התחברות" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; sent?: string }> }) {
  const { callbackUrl = "/dashboard", sent } = await searchParams;
  if (await getSessionUser()) redirect("/dashboard");
  const none = !enabledProviders.google && !enabledProviders.email && !enabledProviders.dev;

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <div className="mb-6 text-center">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-3xl font-extrabold">התחברות או הרשמה</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">שומרים התקדמות, משתתפים בקהילה ומקבלים גישה לתכנים נוספים. ההרשמה בחינם.</p>
      </div>
      {sent && (
        <Notice tone="success" className="mb-4">
          שלחנו לכם קישור התחברות במייל. אפשר לסגור את הלשונית הזו.
        </Notice>
      )}
      <Card className="space-y-6 p-6 sm:p-8">
        {enabledProviders.google && (
          <form action={signInWith}>
            <input type="hidden" name="provider" value="google" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button variant="secondary" className="w-full" size="lg">
              התחברות עם Google
            </Button>
          </form>
        )}
        {enabledProviders.email && (
          <form action={signInWith} className="space-y-3">
            <input type="hidden" name="provider" value="nodemailer" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <label className="block">
              <span className={labelClass}>אימייל</span>
              <input type="email" name="email" required autoComplete="email" placeholder="name@example.com" dir="ltr" className={inputClass} />
            </label>
            <Button className="w-full" size="lg">
              שליחת קישור התחברות
            </Button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">נשלח לכם קישור, בלי סיסמה לזכור.</p>
          </form>
        )}
        {enabledProviders.dev && (
          <form action={signInWith} className="space-y-3 rounded-xl border border-dashed border-amber-400 p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">מצב פיתוח: התחברות ללא סיסמה</p>
            <input type="hidden" name="provider" value="dev" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="email" name="email" required autoComplete="email" placeholder="dev@example.com" dir="ltr" className={inputClass} aria-label="אימייל" />
            <Button className="w-full">כניסה</Button>
          </form>
        )}
        {none && <p className="text-sm text-slate-500">לא הוגדרו שיטות התחברות. ראו את הקובץ ‎.env.example.</p>}
      </Card>
    </div>
  );
}
