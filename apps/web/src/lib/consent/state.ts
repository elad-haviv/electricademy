/**
 * Consent state: pure functions, no browser APIs (unit-tested in state.test.ts).
 * The client store (store.ts) persists the record in localStorage under CONSENT_STORAGE_KEY.
 */
import { OPTIONAL_CATEGORIES, type ConsentCategory, type OptionalCategory } from "./registry";

export const CONSENT_STORAGE_KEY = "electricademy.consent";

/**
 * Bump when the cookie policy changes in a way users should see (a new category, a new third party,
 * a new purpose). Every stored decision with another version is discarded and the banner shows again.
 */
export const POLICY_VERSION = "2026-11-08";

/** A decision is valid for 6 months, then we ask again (CNIL / EDPB practice: 6-13 months). */
export const CONSENT_MAX_AGE_DAYS = 182;

export type ConsentChoices = Record<OptionalCategory, boolean>;

export type ConsentMethod = "accept-all" | "reject-all" | "custom" | "embed";

export interface ConsentRecord {
  /** Record schema version. */
  schema: 1;
  /** POLICY_VERSION the user saw when deciding. */
  policyVersion: string;
  /** ISO timestamp of the decision. */
  decidedAt: string;
  /** ISO timestamp after which the decision lapses. */
  expiresAt: string;
  /** How the decision was made (first-layer button, settings dialog, or a click-to-load placeholder). */
  method: ConsentMethod;
  choices: ConsentChoices;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const NO_CONSENT: ConsentChoices = Object.freeze({ functional: false, analytics: false });

export function allChoices(value: boolean): ConsentChoices {
  return Object.fromEntries(OPTIONAL_CATEGORIES.map((c) => [c, value])) as ConsentChoices;
}

export function createRecord(choices: ConsentChoices, method: ConsentMethod, now: Date = new Date()): ConsentRecord {
  return {
    schema: 1,
    policyVersion: POLICY_VERSION,
    decidedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CONSENT_MAX_AGE_DAYS * DAY_MS).toISOString(),
    method,
    // copy only known categories, never trust extra keys
    choices: Object.fromEntries(OPTIONAL_CATEGORIES.map((c) => [c, choices[c] === true])) as ConsentChoices,
  };
}

/** Parse a stored record. Anything malformed is treated as "no decision". */
export function parseRecord(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const r = data as Partial<ConsentRecord>;
  if (r.schema !== 1 || typeof r.policyVersion !== "string" || typeof r.decidedAt !== "string" || typeof r.expiresAt !== "string") return null;
  if (Number.isNaN(Date.parse(r.decidedAt)) || Number.isNaN(Date.parse(r.expiresAt))) return null;
  if (!r.choices || typeof r.choices !== "object") return null;
  const method: ConsentMethod = r.method === "accept-all" || r.method === "reject-all" || r.method === "embed" ? r.method : "custom";
  const choices = Object.fromEntries(
    OPTIONAL_CATEGORIES.map((c) => [c, (r.choices as Record<string, unknown>)[c] === true]),
  ) as ConsentChoices;
  return { schema: 1, policyVersion: r.policyVersion, decidedAt: r.decidedAt, expiresAt: r.expiresAt, method, choices };
}

/** A record counts only for the current policy version and until it expires. */
export function isCurrent(record: ConsentRecord | null, now: Date = new Date()): record is ConsentRecord {
  if (!record) return false;
  if (record.policyVersion !== POLICY_VERSION) return false;
  const expires = Date.parse(record.expiresAt);
  const decided = Date.parse(record.decidedAt);
  // a decision "from the future" (clock skew, tampering) or one stretched past the max age is not trusted
  if (decided > now.getTime() + DAY_MS) return false;
  if (expires - decided > CONSENT_MAX_AGE_DAYS * DAY_MS + DAY_MS) return false;
  return now.getTime() < expires;
}

/** Choices in force: the stored ones while current, otherwise nothing optional. */
export function effectiveChoices(record: ConsentRecord | null, now: Date = new Date()): ConsentChoices {
  return isCurrent(record, now) ? record.choices : NO_CONSENT;
}

export function needsDecision(record: ConsentRecord | null, now: Date = new Date()): boolean {
  return !isCurrent(record, now);
}

export function allows(record: ConsentRecord | null, category: ConsentCategory, now: Date = new Date()): boolean {
  if (category === "necessary") return true;
  return effectiveChoices(record, now)[category];
}

export function allowsAll(record: ConsentRecord | null, categories: readonly ConsentCategory[], now: Date = new Date()): boolean {
  return categories.every((c) => allows(record, c, now));
}

/**
 * Grant extra categories (from a click-to-load placeholder), keeping every other choice.
 * Starts from nothing when the stored record is stale, so an expired "yes" is never revived.
 */
export function grant(record: ConsentRecord | null, categories: readonly OptionalCategory[], now: Date = new Date()): ConsentRecord {
  const base = { ...effectiveChoices(record, now) };
  for (const c of categories) base[c] = true;
  return createRecord(base, "embed", now);
}

/** Optional categories that were on and are now off: their storage must be deleted. */
export function withdrawn(before: ConsentChoices, after: ConsentChoices): OptionalCategory[] {
  return OPTIONAL_CATEGORIES.filter((c) => before[c] && !after[c]);
}
