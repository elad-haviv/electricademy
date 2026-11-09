import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buttonClass } from "@electricademy/ui";
import { EXAM_TOPICS, loadExamBank } from "@electricademy/content";
import { BankQuestionCard } from "@/components/license-exam/BankQuestionCard";
import { aiAvailableForCurrentUser } from "@/lib/askAi";
import { ExamDiscussion } from "@/components/license-exam/ExamDiscussion";
import { LimitNotice } from "@/components/license-exam/LimitNotice";
import { guardExamContent } from "@/lib/contentGuard";
import { requireExamUser, toClient } from "@/lib/licenseExam";

// The discussion reads the database and the session on every request.
export const dynamic = "force-dynamic";

const find = (n: string) => (/^\d+$/.test(n) ? loadExamBank().byNumber.get(Number(n)) : undefined);

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const q = find((await params).n);
  if (!q) return {};
  // no question text here: metadata is rendered even for guests on their way to the login page
  return {
    title: `שאלה ${q.n} · מאגר בחינות רישוי בחשמל`,
    description: "שאלה מהמאגר הרשמי לבחינות הרישוי בחשמל, עם תשובה, הסבר ודיון. למשתמשים רשומים.",
    robots: { index: false, follow: false },
  };
}

export default async function QuestionPage({ params }: { params: Promise<{ n: string }> }) {
  const q = find((await params).n);
  if (!q) notFound();
  const user = await requireExamUser(`/license-exam/q/${q.n}`);
  const { count } = loadExamBank().meta;
  const guard = await guardExamContent(user.id, { view: [q.n] });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/license-exam">סימולטור בחינות רישוי</Link> / <Link href="/license-exam/browse">מאגר</Link> /{" "}
        <Link href={`/license-exam/browse?topic=${q.topic}`}>{EXAM_TOPICS[q.topic].title}</Link>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight">שאלה {q.n}</h1>
      {guard.ok ? (
        <>
          <BankQuestionCard q={toClient(q)} link={false} aiEnabled={await aiAvailableForCurrentUser()} />
          <ExamDiscussion n={q.n} userId={user.id} />
        </>
      ) : (
        <LimitNotice notice={guard} />
      )}
      <div className="flex justify-between gap-2">
        {q.n > 1 ? (
          <Link href={`/license-exam/q/${q.n - 1}`} prefetch={false} className={buttonClass("secondary")}>
            → שאלה {q.n - 1}
          </Link>
        ) : (
          <span />
        )}
        {q.n < count && (
          <Link href={`/license-exam/q/${q.n + 1}`} prefetch={false} className={buttonClass("secondary")}>
            שאלה {q.n + 1} ←
          </Link>
        )}
      </div>
    </div>
  );
}
