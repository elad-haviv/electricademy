import Link from "next/link";
import type { Metadata } from "next";
import { EXAM_TOPICS, type ExamTopic } from "@electricademy/content";
import { PracticeSession } from "@/components/license-exam/PracticeSession";
import { topicCountsByLevel } from "@/lib/licenseExam";

export const metadata: Metadata = {
  title: "תרגול שאלות רישוי לפי נושא",
  description: "תרגול שאלות מהמאגר הרשמי לבחינות הרישוי בחשמל, לפי נושא או מתוך השאלות ששמרתם.",
};

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topic?: string; source?: string }> }) {
  const { topic, source } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/license-exam">סימולטור בחינות רישוי</Link> / תרגול
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight">תרגול לפי נושא</h1>
      <PracticeSession
        topicCounts={topicCountsByLevel()}
        initialTopic={topic && topic in EXAM_TOPICS ? (topic as ExamTopic) : undefined}
        initialSource={source === "bookmarks" ? "bookmarks" : "topics"}
      />
    </div>
  );
}
