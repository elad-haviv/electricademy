"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ExamLevel } from "@electricademy/content/license-exam";
import { currentChoices, explicitlyRefused, subscribeConsent } from "@/lib/consent/store";

/**
 * Per-browser study state. Signed-in exam attempts are also saved on the server (quiz_attempt).
 *
 * Two localStorage keys, classified in lib/consent/registry.ts:
 * - BOOKMARKS_KEY (strictly necessary): the questions the learner explicitly asked us to save with
 *   the "שמירה לחזרה" button. Written only when they press it.
 * - PREFS_KEY (functional, needs consent): exam history and last licence level, which we record on
 *   our own initiative. Without consent they live in memory for this page view only.
 * Older versions kept all three in BOOKMARKS_KEY; read() moves them out once consent allows.
 */
export interface ExamHistoryEntry {
  at: string;
  level: ExamLevel;
  total: number;
  answered: number;
  keyed: number;
  correct: number;
  seconds: number;
}

interface Prefs {
  history: ExamHistoryEntry[];
  level?: ExamLevel;
}

interface Stored extends Prefs {
  bookmarks: number[];
}

export const BOOKMARKS_KEY = "electricademy.license-exam.v1";
export const PREFS_KEY = "electricademy.license-exam.prefs.v1";
const EMPTY: Stored = { bookmarks: [], history: [] };
const listeners = new Set<() => void>();
let snapshot: Stored | null = null;
/** Prefs kept in memory while functional storage is not allowed. */
let memoryPrefs: Prefs = { history: [] };

function parse(raw: string | null): Partial<Stored> {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as Partial<Stored> | null;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function setItem(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / storage full: keep the in-memory state
  }
}

function mergePrefs(a: Prefs, b: Prefs): Prefs {
  const seen = new Set<string>();
  const history = [...a.history, ...b.history]
    .filter((e) => (seen.has(e.at) ? false : (seen.add(e.at), true)))
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, 30);
  return { history, level: a.level ?? b.level };
}

function read(): Stored {
  if (snapshot) return snapshot;
  let legacy: Partial<Stored> = {};
  let stored: Partial<Prefs> = {};
  try {
    legacy = parse(window.localStorage.getItem(BOOKMARKS_KEY));
    if (currentChoices().functional) stored = parse(window.localStorage.getItem(PREFS_KEY));
  } catch {
    // storage blocked
  }
  const bookmarks = Array.isArray(legacy.bookmarks) ? legacy.bookmarks : [];
  const hasLegacyPrefs = legacy.history !== undefined || legacy.level !== undefined;
  let prefs = memoryPrefs;
  if (currentChoices().functional) {
    const fromDisk: Prefs = {
      history: [...(stored.history ?? []), ...(legacy.history ?? [])],
      level: stored.level ?? legacy.level,
    };
    prefs = mergePrefs(memoryPrefs, fromDisk);
    if (prefs.history.length || prefs.level) setItem(PREFS_KEY, prefs);
    if (hasLegacyPrefs) setItem(BOOKMARKS_KEY, { bookmarks });
  } else if (hasLegacyPrefs && explicitlyRefused("functional")) {
    setItem(BOOKMARKS_KEY, { bookmarks });
  }
  memoryPrefs = prefs;
  snapshot = { bookmarks, history: prefs.history, level: prefs.level };
  return snapshot;
}

/** Rewrites the necessary key. Legacy prefs in it are left alone until the user has decided about consent. */
function writeBookmarks(bookmarks: number[]) {
  let legacy: Partial<Stored> = {};
  if (!currentChoices().functional && !explicitlyRefused("functional")) {
    try {
      const { history, level } = parse(window.localStorage.getItem(BOOKMARKS_KEY));
      legacy = { history, level };
    } catch {
      // storage blocked
    }
  }
  setItem(BOOKMARKS_KEY, { ...legacy, bookmarks });
}

function write(next: Stored) {
  const prev = read();
  snapshot = next;
  memoryPrefs = { history: next.history, level: next.level };
  if (next.bookmarks !== prev.bookmarks) writeBookmarks(next.bookmarks);
  if ((next.history !== prev.history || next.level !== prev.level) && currentChoices().functional) {
    setItem(PREFS_KEY, memoryPrefs);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOOKMARKS_KEY || e.key === PREFS_KEY) {
      snapshot = null;
      listener();
    }
  };
  // Consent changed: re-read so prefs are saved (granted) or stay in memory only (withdrawn).
  const stopConsent = subscribeConsent(() => {
    snapshot = null;
    listener();
  });
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    stopConsent();
    window.removeEventListener("storage", onStorage);
  };
}

export function useExamStorage() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggleBookmark = useCallback((n: number) => {
    const cur = read();
    const bookmarks = cur.bookmarks.includes(n) ? cur.bookmarks.filter((b) => b !== n) : [...cur.bookmarks, n].sort((a, b) => a - b);
    write({ ...cur, bookmarks });
  }, []);
  const addHistory = useCallback((entry: ExamHistoryEntry) => {
    const cur = read();
    write({ ...cur, history: [entry, ...cur.history].slice(0, 30) });
  }, []);
  const setLevel = useCallback((level: ExamLevel) => write({ ...read(), level }), []);
  return { ...state, toggleBookmark, addHistory, setLevel };
}
