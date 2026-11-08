"use client";

import { useSyncExternalStore } from "react";
import { FIRST_PARTY_ITEMS, type OptionalCategory } from "./registry";
import {
  CONSENT_STORAGE_KEY,
  allChoices,
  createRecord,
  effectiveChoices,
  grant,
  isCurrent,
  parseRecord,
  withdrawn,
  type ConsentChoices,
  type ConsentMethod,
  type ConsentRecord,
} from "./state";

/**
 * Client-side consent store. The record lives in localStorage (strictly necessary: it stores the
 * user's own choice) and is shared by every tab through the "storage" event.
 */
interface Snapshot {
  /** false only during SSR / before hydration, when we can't know the choice yet. */
  loaded: boolean;
  record: ConsentRecord | null;
  settingsOpen: boolean;
}

const SERVER_SNAPSHOT: Snapshot = { loaded: false, record: null, settingsOpen: false };
const listeners = new Set<() => void>();
let snapshot: Snapshot | null = null;
let enforced = false;

function readRecord(): ConsentRecord | null {
  try {
    return parseRecord(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function getSnapshot(): Snapshot {
  if (!snapshot) {
    snapshot = { loaded: true, record: readRecord(), settingsOpen: false };
    if (!enforced) {
      enforced = true;
      // An explicit "no" that is still current: make sure nothing of that category was left behind.
      if (isCurrent(snapshot.record)) deleteStorageFor(withdrawn(allChoices(true), snapshot.record.choices));
    }
  }
  return snapshot;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY || e.key === null) {
      snapshot = { loaded: true, record: readRecord(), settingsOpen: snapshot?.settingsOpen ?? false };
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Delete first-party storage that belongs to categories the user turned off. */
function deleteStorageFor(categories: OptionalCategory[]) {
  if (categories.length === 0) return;
  for (const item of FIRST_PARTY_ITEMS) {
    if (item.category === "necessary" || !categories.includes(item.category)) continue;
    try {
      if (item.kind === "localStorage") window.localStorage.removeItem(item.name);
      else if (item.kind === "sessionStorage") window.sessionStorage.removeItem(item.name);
      else if (item.kind === "cookie") document.cookie = `${item.name}=; Max-Age=0; Path=/; SameSite=Lax`;
    } catch {
      // storage blocked: nothing to delete
    }
  }
}

function persist(record: ConsentRecord) {
  const before = effectiveChoices(getSnapshot().record);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // storage blocked: the choice still applies for this page view
  }
  deleteStorageFor(withdrawn(before, record.choices));
  snapshot = { loaded: true, record, settingsOpen: false };
  emit();
}

export function saveConsent(choices: ConsentChoices, method: ConsentMethod) {
  persist(createRecord(choices, method));
}

export const acceptAll = () => saveConsent(allChoices(true), "accept-all");
export const rejectAll = () => saveConsent(allChoices(false), "reject-all");

/** Used by click-to-load placeholders: turn on exactly these categories, keep the rest. */
export function grantConsent(categories: readonly OptionalCategory[]) {
  persist(grant(getSnapshot().record, categories));
}

export function openConsentSettings() {
  snapshot = { ...getSnapshot(), settingsOpen: true };
  emit();
}

export function closeConsentSettings() {
  snapshot = { ...getSnapshot(), settingsOpen: false };
  emit();
}

/** Non-hook access for other client stores (e.g. license-exam storage). */
export function currentChoices(): ConsentChoices {
  return effectiveChoices(getSnapshot().record);
}

/** True when the user has explicitly said no to `category` (as opposed to not having decided yet). */
export function explicitlyRefused(category: OptionalCategory): boolean {
  const { record } = getSnapshot();
  return isCurrent(record) && !record.choices[category];
}

export function subscribeConsent(listener: () => void) {
  return subscribe(listener);
}

export function useConsent() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const current = isCurrent(snap.record);
  return {
    /** false during SSR and the first hydration pass. */
    loaded: snap.loaded,
    record: current ? snap.record : null,
    choices: effectiveChoices(snap.record),
    needsDecision: snap.loaded && !current,
    settingsOpen: snap.settingsOpen,
  };
}
