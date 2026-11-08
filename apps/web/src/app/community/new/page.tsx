import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { allLessonPaths } from "@electricademy/content";
import { Card } from "@electricademy/ui";
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
      <h1 className="mb-6 text-3xl font-extrabold">דיון חדש</h1>
      <Card>
        {lessonPath && <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">הדיון יקושר לשיעור: {lessonPath}</p>}
        <NewThreadForm lessonPath={lessonPath} />
      </Card>
    </div>
  );
}
