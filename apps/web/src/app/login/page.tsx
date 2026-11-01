import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button, Card } from "@electricademy/ui";
import { enabledProviders } from "@/auth";
import { signInWith } from "@/lib/actions";
import { getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "התחברות" };

const inputClass =
  "w-full rounded-xl bg-white px-3 py-2 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:ring-slate-700";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; sent?: string }> }) {
  const { callbackUrl = "/dashboard", sent } = await searchParams;
  if (await getSessionUser()) redirect("/dashboard");
  const none = !enabledProviders.google && !enabledProviders.email && !enabledProviders.dev;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl font-extrabold">התחברות</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">הצטרפו כדי לשמור התקדמות, להשתתף בקהילה ולקבל גישה לתכנים נוספים.</p>
      {sent && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          שלחנו לכם קישור התחברות במייל.
        </p>
      )}
      <Card className="space-y-6">
        {enabledProviders.google && (
          <form action={signInWith}>
            <input type="hidden" name="provider" value="google" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button variant="secondary" className="w-full">
              התחברות עם Google
            </Button>
          </form>
        )}
        {enabledProviders.email && (
          <form action={signInWith} className="space-y-3">
            <input type="hidden" name="provider" value="nodemailer" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="email" name="email" required placeholder="name@example.com" dir="ltr" className={inputClass} aria-label="אימייל" />
            <Button className="w-full">שליחת קישור התחברות</Button>
          </form>
        )}
        {enabledProviders.dev && (
          <form action={signInWith} className="space-y-3 rounded-xl border border-dashed border-amber-400 p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">מצב פיתוח: התחברות ללא סיסמה</p>
            <input type="hidden" name="provider" value="dev" />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="email" name="email" required placeholder="dev@example.com" dir="ltr" className={inputClass} aria-label="אימייל" />
            <Button className="w-full">כניסה</Button>
          </form>
        )}
        {none && <p className="text-sm text-slate-500">לא הוגדרו שיטות התחברות. ראו את הקובץ ‎.env.example.</p>}
      </Card>
    </div>
  );
}
