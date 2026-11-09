"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Square, X } from "lucide-react";
import { cn } from "@electricademy/ui";
import { LimitNotice, type Notice } from "./LimitNotice";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** From the reply's X-AI-* headers: the learner's tier and today's token use when the reply started. */
interface Quota {
  tier: "free" | "pro";
  used: number;
  limit: number;
}

function readQuota(res: Response): Quota | null {
  const tier = res.headers.get("X-AI-Tier");
  const used = Number(res.headers.get("X-AI-Used"));
  const limit = Number(res.headers.get("X-AI-Limit"));
  if ((tier !== "free" && tier !== "pro") || !Number.isFinite(used) || !(limit > 0)) return null;
  return { tier, used, limit };
}

const SUGGESTIONS = ["למה זו התשובה הנכונה?", "הסבר לי את החישוב צעד אחר צעד", "מה לא נכון בשאר האפשרויות?", "באיזו תקנה זה כתוב?"];

/**
 * "התייעצות עם AI" for one bank question (practice, browse, question page), opened from the ✨ next to the
 * answer (AskAiSparkle in KeyNote). Talks to POST
 * /api/license-exam/ask, which streams plain text. The conversation lives only in this component.
 */
export function AskAi({ n, onClose }: { n: number; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [status, setStatus] = useState("");
  const [quota, setQuota] = useState<Quota | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // opened from the ✨ next to the answer: go straight to the input; stop a reply in flight on close
  useEffect(() => {
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setNotice(null);
    setUpgrade(false);
    setStatus("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/license-exam/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n, messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string; retry?: Notice["retry"]; upgrade?: boolean; quota?: Quota } | null;
        setMessages(history.slice(0, -1)); // give the learner their text back in the box
        setDraft(content);
        setNotice({ message: err?.error ?? "משהו השתבש. נסו שוב.", retry: err?.retry });
        setUpgrade(Boolean(err?.upgrade));
        if (err?.quota) setQuota(err.quota);
        return;
      }
      setQuota(readQuota(res));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      if (!reply.trim()) {
        setMessages(history);
        setNotice({ message: "לא התקבלה תשובה. נסו לנסח את השאלה אחרת." });
      } else setStatus("ה-AI ענה.");
    } catch (err) {
      if ((err as Error).name === "AbortError") setStatus("התשובה נעצרה.");
      else setNotice({ message: "החיבור נקטע. בדקו את החיבור ונסו שוב." });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <section aria-label="התייעצות עם AI" className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            <Bot className="size-5 text-brand-600 dark:text-brand-300" aria-hidden />
            התייעצות עם AI
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            התשובות נוצרות על ידי מודל בינה מלאכותית ועלולות לטעות; בדקו מול התקנות. מה שתכתבו נשלח לשירות חיצוני (OpenRouter), אז אל תכתבו פרטים
            אישיים.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            abortRef.current?.abort();
            onClose();
          }}
          aria-label="סגירת ההתייעצות"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="שאלות מוצעות">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="min-h-11 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-600 dark:hover:bg-slate-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <ol className="space-y-3" aria-label="השיחה" aria-busy={streaming}>
          {messages.map((m, i) => (
            <li
              key={i}
              className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]",
                m.role === "user"
                  ? "ms-8 bg-brand-50 text-slate-900 dark:bg-brand-950/50 dark:text-slate-100"
                  : "me-8 bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-800",
              )}
            >
              <span className="sr-only">{m.role === "user" ? "אתם: " : "AI: "}</span>
              {m.content
                ? // each line picks its own direction: a formula line ("- In = S / (√3 · U)") reads left to right
                  m.content.split("\n").map((line, j) => (
                    <span key={j} dir="auto" className="block min-h-[1lh]">
                      {line}
                    </span>
                  ))
                : streaming && i === messages.length - 1 && <span className="text-slate-500 dark:text-slate-400">חושב…</span>}
            </li>
          ))}
        </ol>
      )}
      <div ref={endRef} />

      <p className="sr-only" role="status">
        {status}
      </p>
      <LimitNotice notice={notice} />
      {upgrade && (
        <p className="text-sm">
          <Link href="/pricing" className="font-semibold text-brand-700 underline dark:text-brand-300">
            למסלולי המנוי
          </Link>
        </p>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <label className="flex-1">
          <span className="sr-only">השאלה שלכם ל-AI</span>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            maxLength={1200}
            placeholder={messages.length ? "שאלת המשך…" : "מה לא ברור בשאלה?"}
            className="w-full resize-none rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-control outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-950 dark:ring-control-dark"
          />
        </label>
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800"
          >
            <Square className="size-4" aria-hidden />
            עצירה
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="size-4 -scale-x-100" aria-hidden />
            שליחה
          </button>
        )}
      </form>
      {quota && <QuotaLine quota={quota} upsell={!upgrade} />}
    </section>
  );
}

/** "Basic/advanced model · N% of today's allowance used", with an upgrade link for the free tier. */
function QuotaLine({ quota, upsell }: { quota: Quota; upsell: boolean }) {
  const pct = Math.min(100, Math.round((quota.used / quota.limit) * 100));
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
      <span>{quota.tier === "pro" ? "מודל מתקדם" : "מודל בסיסי"}</span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <span className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
        </span>
        נוצלו {pct}% מהמכסה היומית
      </span>
      {upsell && quota.tier === "free" && (
        <Link href="/pricing" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          מודל מתקדם ומכסה גדולה יותר במנוי
        </Link>
      )}
    </div>
  );
}
