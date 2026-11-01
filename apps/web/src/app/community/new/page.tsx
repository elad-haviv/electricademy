import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { allLessonPaths } from "@electricademy/content";
import { Card, SectionHeading } from "@electricademy/ui";
import { Crumbs } from "@/components/Crumbs";
import { NewThreadForm } from "@/components/forms";
import { getSessionUser } from "@/lib/session";

// Reads the database / session on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "דיון חדש" };

export default async function NewThreadPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const { lesson } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/community/new${lesson ? `?lesson=${lesson}` : ""}`)}`);
  const lessonPath = lesson && allLessonPaths().includes(lesson) ? lesson : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <Crumbs items={[{ label: "קהילה", href: "/community" }, { label: "דיון חדש" }]} />
      <SectionHeading as="h1" title="דיון חדש" subtitle="כותרת ברורה ופירוט של מה שכבר ניסיתם יעזרו לקהילה לענות מהר יותר." />
      <Card>
        {lessonPath && (
          <p className="mb-5 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:bg-brand-950/50 dark:text-brand-100">
            הדיון יקושר לשיעור: <span dir="ltr">{lessonPath}</span>
          </p>
        )}
        <NewThreadForm lessonPath={lessonPath} />
      </Card>
    </div>
  );
}
