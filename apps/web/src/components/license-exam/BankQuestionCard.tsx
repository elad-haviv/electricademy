import Link from "next/link";
import { Card } from "@electricademy/ui";
import type { ClientQuestion } from "@/lib/licenseExam";
import { BookmarkButton } from "./BookmarkButton";
import { OptionList, QuestionMeta, QuestionStem } from "./Question";
import { RevealAnswer } from "./RevealAnswer";

/** A question as it appears in the bank (browse / single page): options static, answer on demand. */
export function BankQuestionCard({ q, link = true, comments }: { q: ClientQuestion; link?: boolean; comments?: number }) {
  return (
    <Card id={`q${q.n}`} className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <QuestionMeta q={q} />
        <div className="flex items-center gap-2">
          {link && (
            <Link href={`/license-exam/q/${q.n}#discussion`} prefetch={false} className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
              💬 דיון{comments ? ` (${comments})` : ""}
            </Link>
          )}
          <BookmarkButton n={q.n} />
        </div>
      </div>
      <QuestionStem q={q} />
      <OptionList q={q} stateOf={() => "idle"} />
      {q.keyed ? (
        <RevealAnswer n={q.n} />
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">עוד אין לנו תשובה מאומתת לשאלה הזו.</p>
      )}
    </Card>
  );
}
