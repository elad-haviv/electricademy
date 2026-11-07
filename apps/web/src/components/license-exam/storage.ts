"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ExamLevel } from "@electricademy/content/license-exam";

/** Per-browser study state. Signed-in exam attempts are also saved on the server (quiz_attempt). */
export interface ExamHistoryEntry {
  at: string;
  level: ExamLevel;
  total: number;
  answered: number;
  keyed: number;
  correct: number;
  seconds: number;
}

interface Stored {
  bookmarks: number[];
  history: ExamHistoryEntry[];
  level?: ExamLevel;
}

const KEY = "electricademy.license-exam.v1";
const EMPTY: Stored = { bookmarks: [], history: [] };
const listeners = new Set<() => void>();
let snapshot: Stored | null = null;

function read(): Stored {
  if (snapshot) return snapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    snapshot = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Stored>) } : EMPTY;
  } catch {
    snapshot = EMPTY;
  }
  return snapshot;
}

function write(next: Stored) {
  snapshot = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode / storage full: keep the in-memory state
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
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
