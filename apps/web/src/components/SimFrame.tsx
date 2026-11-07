"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Maximize2, Radio } from "lucide-react";
import { listenToSimulators, sendSession } from "@electricademy/sim-sdk";
import { issueSimSession, recordSimEvent } from "@/lib/simActions";

type ModuleState = { percent: number; completed: boolean; score?: number };
type Link_ = "waiting" | "connected" | "silent";

/** How long to wait for the simulator's "ready" before saying it doesn't report progress. */
const READY_TIMEOUT_MS = 8000;

export function SimFrame({
  slug,
  name,
  url,
  origin,
  loggedIn,
}: {
  slug: string;
  name: string;
  url: string;
  origin: string;
  loggedIn: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [link, setLink] = useState<Link_>("waiting");
  const [modules, setModules] = useState<Record<string, ModuleState>>({});
  const [toast, setToast] = useState<string | null>(null);

  // One "opened" event per visit (signed-in users only). The ref keeps React's dev-mode
  // double effect from logging two visits.
  const openedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!loggedIn || openedFor.current === slug) return;
    openedFor.current = slug;
    void recordSimEvent(slug, { type: "opened" });
  }, [slug, loggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => setLink((l) => (l === "waiting" ? "silent" : l)), READY_TIMEOUT_MS);
    let readySeen = false;
    const stop = listenToSimulators([origin], async (msg) => {
      if (msg.simulator !== slug) return;
      if (msg.type === "ready") {
        setLink("connected");
        const frame = frameRef.current?.contentWindow;
        if (frame) sendSession(frame, origin, await issueSimSession(slug));
        if (!readySeen && loggedIn) void recordSimEvent(slug, { type: "ready" });
        readySeen = true;
        return;
      }
      if (msg.type === "progress") {
        setModules((m) => {
          const prev = m[msg.module];
          return prev && prev.percent >= msg.percent ? m : { ...m, [msg.module]: { completed: false, ...prev, percent: msg.percent } };
        });
        if (loggedIn) void recordSimEvent(slug, { type: "progress", module: msg.module, percent: msg.percent });
        return;
      }
      if (msg.type === "completed") {
        setModules((m) => ({ ...m, [msg.module]: { percent: 100, completed: true, score: msg.score } }));
        if (!loggedIn) return;
        const res = await recordSimEvent(slug, { type: "completed", module: msg.module, score: msg.score });
        if (res.saved && res.xp > 0) setToast(`כל הכבוד! השלמתם את ${msg.module} וקיבלתם ${res.xp} XP`);
      }
    });
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [slug, origin, loggedIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const entries = Object.entries(modules);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Status link={link} loggedIn={loggedIn} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void wrapRef.current?.requestFullscreen?.()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Maximize2 className="size-3.5" aria-hidden />
            מסך מלא
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            בלשונית חדשה
          </a>
        </div>
      </div>

      <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg dark:border-slate-800">
        <iframe
          ref={frameRef}
          src={url}
          title={name}
          className="block h-[calc(100dvh-15rem)] min-h-[560px] w-full bg-white"
          allow="fullscreen; xr-spatial-tracking; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {entries.length > 0 && (
        <section aria-label="התקדמות בביקור הזה" className="flex flex-wrap gap-2">
          {entries.map(([mod, s]) => (
            <span
              key={mod}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                s.completed ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {s.completed && <CheckCircle2 className="size-3.5" aria-hidden />}
              <bdi>{mod}</bdi> · {Math.round(s.percent)}%
            </span>
          ))}
        </section>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white shadow-xl md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

function Status({ link, loggedIn }: { link: Link_; loggedIn: boolean }) {
  if (link === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <Radio className="size-3.5" aria-hidden />
        {loggedIn ? "מחובר: ההתקדמות נשמרת באזור שלכם" : "מחובר"}
        {!loggedIn && (
          <Link href="/login" className="underline">
            התחברו כדי לשמור התקדמות
          </Link>
        )}
      </span>
    );
  }
  if (link === "silent") {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        הסימולטור הזה עדיין לא מדווח התקדמות לאתר.{loggedIn ? " הכניסה נרשמת באזור שלכם." : ""}
      </span>
    );
  }
  return <span className="text-xs text-slate-500 dark:text-slate-400">טוען את הסימולטור…</span>;
}
