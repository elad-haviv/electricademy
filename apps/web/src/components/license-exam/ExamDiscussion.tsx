import Link from "next/link";
import { Badge, buttonClass, Card } from "@electricademy/ui";
import { getExamDiscussion, type ExamCommentView } from "@/lib/examDiscussion";
import { deleteExamComment } from "@/lib/examDiscussionActions";
import { formatDate } from "@/lib/labels";
import { CommentForm, ReplyToggle } from "./DiscussionForms";

/** Discussion under a bank question: comments, one level of replies, and the community's answer tally. */
export async function ExamDiscussion({ n, userId, keyAnswer }: { n: number; userId: string | null; keyAnswer?: number }) {
  const data = await getExamDiscussion(n).catch(() => null);
  if (!data) {
    return (
      <Card id="discussion">
        <h2 className="text-lg font-bold">דיון על השאלה</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">הדיון לא זמין כרגע.</p>
      </Card>
    );
  }
  const { comments, tally } = data;
  const top = comments.filter((c) => c.parentId === null);
  const replies = (id: number) => comments.filter((c) => c.parentId === id);
  const voters = Object.values(tally).reduce((s, v) => s + v, 0);

  return (
    <Card id="discussion" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">דיון על השאלה {comments.length > 0 && <span className="text-slate-500">({comments.filter((c) => !c.deleted).length})</span>}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">חשבתם שהתשובה שגויה? כתבו למה, רצוי עם סעיף בתקנות.</p>
      </div>

      {voters > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">תשובת הקהילה ({voters} {voters === 1 ? "משתתף" : "משתתפים"})</p>
          <ul className="space-y-1">
            {[1, 2, 3, 4].map((a) => {
              const v = tally[a] ?? 0;
              return (
                <li key={a} className="flex items-center gap-2 text-sm">
                  <span className="w-4 font-bold tabular-nums">{a}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className={`block h-full ${a === keyAnswer ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${(v / voters) * 100}%` }} />
                  </span>
                  <span className="w-8 text-end text-slate-600 tabular-nums dark:text-slate-400">{v}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {top.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">עוד אין תגובות. פתחו את הדיון.</p>
      ) : (
        <ul className="space-y-4">
          {top.map((c) => (
            <li key={c.id} className="space-y-3">
              <Comment c={c} userId={userId} n={n} />
              {replies(c.id).length > 0 && (
                <ul className="ms-6 space-y-3 border-s-2 border-slate-200 ps-4 dark:border-slate-800">
                  {replies(c.id).map((r) => (
                    <li key={r.id}>
                      <Comment c={r} userId={userId} n={n} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        {userId ? (
          <CommentForm n={n} />
        ) : (
          <Link href={`/login?callbackUrl=/license-exam/q/${n}`} className={buttonClass("secondary")}>
            התחברו כדי להשתתף בדיון
          </Link>
        )}
      </div>
    </Card>
  );
}

function Comment({ c, userId, n }: { c: ExamCommentView; userId: string | null; n: number }) {
  if (c.deleted) return <p className="text-sm text-slate-400 italic">התגובה נמחקה.</p>;
  return (
    <article className="space-y-1">
      <header className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.author}</span>
        <time dateTime={c.createdAt.toISOString()}>{formatDate(c.createdAt)}</time>
        {c.suggestedAnswer && <Badge tone="brand">לדעתי: תשובה {c.suggestedAnswer}</Badge>}
      </header>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
      <div className="flex gap-3">
        {userId && c.parentId === null && <ReplyToggle n={n} parentId={c.id} />}
        {userId === c.authorId && (
          <form action={deleteExamComment}>
            <input type="hidden" name="id" value={c.id} />
            <button className="text-xs font-semibold text-rose-600 hover:underline">מחיקה</button>
          </form>
        )}
      </div>
    </article>
  );
}
