import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

/**
 * Pure building blocks of the license-exam content protection (see docs/ARCHITECTURE.md, "Content
 * protection"): the limits, the client IP behind the proxy, the daily budget arithmetic, signed figure
 * URLs and the signed exam ticket. The database side lives in apps/web/src/lib/contentGuard.ts.
 */

/* ───────────── Limits ───────────── */

export interface ContentLimits {
  /** Content requests (page views of questions, draws, reveals) per user per minute. */
  userPerMinute: number;
  /** The same, per client IP (IPv6: per /64), across all accounts behind it. */
  ipPerMinute: number;
  /** Distinct questions a user may see per day (Israel time). */
  userViewsPerDay: number;
  /** Distinct answers (key + explanation) a user may open per day. */
  userAnswersPerDay: number;
  /** Distinct questions per IP per day, all accounts together (a classroom shares one IP). */
  ipViewsPerDay: number;
  /** Distinct answers per IP per day. */
  ipAnswersPerDay: number;
}

/**
 * A learner who sits six full exams in a day sees 300 questions; nobody honest gets near these numbers.
 * The bank has ~1,100 questions, so one account needs several days to see it all, and one IP at least two.
 */
export const DEFAULT_CONTENT_LIMITS: ContentLimits = {
  userPerMinute: 40,
  ipPerMinute: 150,
  userViewsPerDay: 400,
  userAnswersPerDay: 300,
  ipViewsPerDay: 1000,
  ipAnswersPerDay: 800,
};

const ENV_NAMES: Record<keyof ContentLimits, string> = {
  userPerMinute: "CONTENT_LIMIT_USER_PER_MINUTE",
  ipPerMinute: "CONTENT_LIMIT_IP_PER_MINUTE",
  userViewsPerDay: "CONTENT_LIMIT_USER_VIEWS_PER_DAY",
  userAnswersPerDay: "CONTENT_LIMIT_USER_ANSWERS_PER_DAY",
  ipViewsPerDay: "CONTENT_LIMIT_IP_VIEWS_PER_DAY",
  ipAnswersPerDay: "CONTENT_LIMIT_IP_ANSWERS_PER_DAY",
};

/** The defaults, each overridable by a positive integer in its CONTENT_LIMIT_* environment variable. */
export function contentLimitsFromEnv(env: Record<string, string | undefined>): ContentLimits {
  const out = { ...DEFAULT_CONTENT_LIMITS };
  for (const [k, name] of Object.entries(ENV_NAMES) as [keyof ContentLimits, string][]) {
    const v = Number(env[name]);
    if (Number.isInteger(v) && v > 0) out[k] = v;
  }
  return out;
}

/* ───────────── Client IP ───────────── */

export interface ClientIpOptions {
  /** Trust only this header (e.g. "cf-connecting-ip" or "x-real-ip"); from CLIENT_IP_HEADER. */
  header?: string;
  /** Proxies we run that append to X-Forwarded-For (Traefik = 1); from TRUSTED_PROXY_HOPS. */
  hops?: number;
}

function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  if (ip.startsWith("[") && ip.includes("]")) ip = ip.slice(1, ip.indexOf("]")); // [v6]:port
  else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(":")); // v4:port
  if (ip.toLowerCase().startsWith("::ffff:") && isIP(ip.slice(7)) === 4) ip = ip.slice(7);
  return isIP(ip) ? ip.toLowerCase() : null;
}

/**
 * The visitor's IP as our own proxies saw it. Clients can send any X-Forwarded-For, so we never take its
 * leftmost entry: by default we take the entry `hops` from the right (the one our Traefik appended).
 * Behind Cloudflare that entry is a Cloudflare edge, so CF-Connecting-IP wins when present; it can only be
 * trusted if the origin accepts traffic from Cloudflare alone (see the docs). `header` pins one header.
 */
export function clientIp(get: (name: string) => string | null, opts: ClientIpOptions = {}): string | null {
  if (opts.header) return normalizeIp(get(opts.header.toLowerCase())?.split(",")[0]);
  const cf = normalizeIp(get("cf-connecting-ip"));
  if (cf) return cf;
  const xff = (get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (xff.length) {
    const hops = Math.max(1, opts.hops ?? 1);
    return normalizeIp(xff[Math.max(0, xff.length - hops)]);
  }
  return normalizeIp(get("x-real-ip"));
}

function expandV6(ip: string): string[] {
  const [head = "", tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  // an embedded IPv4 tail (::ffff:1.2.3.4 forms that are not plain mapped) counts as two groups
  const last = t.at(-1) ?? h.at(-1);
  if (last && last.includes(".")) {
    const parts = last.split(".").map(Number);
    const groups = [((parts[0]! << 8) | parts[1]!).toString(16), ((parts[2]! << 8) | parts[3]!).toString(16)];
    if (t.length) t.splice(-1, 1, ...groups);
    else h.splice(-1, 1, ...groups);
  }
  const fill = ip.includes("::") ? Array(8 - h.length - t.length).fill("0") : [];
  return [...h, ...fill, ...t].map((g) => g.padStart(4, "0"));
}

/** The unit a per-IP limit counts: the IPv4 address, or the /64 network of an IPv6 address. */
export function ipBucket(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  return `${expandV6(ip).slice(0, 4).join(":")}::/64`;
}

/* ───────────── Daily budget ───────────── */

/** Budgets reset at midnight Israel time. */
export function dayKey(now: Date = new Date(), timeZone = "Asia/Jerusalem"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Whether `requested` questions fit a daily budget of distinct questions. `already` are the ones counted
 * today (seeing a question again is free); `used` is how many that is.
 */
export function planBudget(already: ReadonlySet<number>, used: number, requested: readonly number[], limit: number): { ok: boolean; fresh: number[] } {
  const fresh = [...new Set(requested)].filter((n) => !already.has(n));
  return { ok: used + fresh.length <= limit, fresh };
}

/* ───────────── Signatures ───────────── */

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const mac = (purpose: string, secret: string, data: string) => createHmac("sha256", `${purpose}:${secret}`).update(data).digest();

function sameMac(given: string, expected: Buffer): boolean {
  const g = Buffer.from(given, "base64url");
  return g.length === expected.length && timingSafeEqual(g, expected);
}

/** Figure files are q<NNNN>-<tag><k>[-<j>].webp (see the extractor); anything else is never served. */
export const FIGURE_FILE = /^q\d{4}-[a-z]\d{1,2}(-\d{1,2})?\.webp$/;

/**
 * Figure URLs expire at a day boundary (UTC) 1-2 days ahead, so a URL stays the same all day (the browser
 * cache works) and still lives long enough for a page left open overnight.
 */
export function figureExpiry(now = Date.now()): number {
  const day = 86_400;
  return (Math.floor(now / 1000 / day) + 2) * day;
}

export function signFigure(file: string, exp: number, secret: string): string {
  if (!secret) throw new Error("A signing secret is required");
  return b64(mac("figure", secret, `${file}|${exp}`).subarray(0, 18));
}

export function verifyFigure(file: string, exp: number, sig: string, secret: string, now = Date.now()): boolean {
  if (!secret || !FIGURE_FILE.test(file) || !Number.isInteger(exp) || exp * 1000 <= now || sig.length > 64) return false;
  return sameMac(sig, mac("figure", secret, `${file}|${exp}`).subarray(0, 18));
}

/**
 * Handed out with a drawn exam and required to grade it, so the grader only ever reveals the keys of the
 * questions the server drew for that user (not any 50 numbers the browser makes up).
 */
export interface ExamTicket {
  sub: string;
  level: string;
  ns: number[];
  /** Issued at, seconds since epoch. */
  iat: number;
}

/** An untimed exam may stay open for a long time; a day and a half is plenty. */
export const EXAM_TICKET_TTL_SECONDS = 36 * 3600;

export function signExamTicket(t: Omit<ExamTicket, "iat">, secret: string, now = Date.now()): string {
  if (!secret) throw new Error("A signing secret is required");
  const body = b64(JSON.stringify({ ...t, iat: Math.floor(now / 1000) } satisfies ExamTicket));
  return `${body}.${b64(mac("exam-ticket", secret, body))}`;
}

export function verifyExamTicket(token: unknown, secret: string, sub: string, now = Date.now(), ttl = EXAM_TICKET_TTL_SECONDS): ExamTicket | null {
  if (!secret || typeof token !== "string" || token.length > 4096) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined || !sameMac(sig, mac("exam-ticket", secret, body))) return null;
  let t: ExamTicket;
  try {
    t = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ExamTicket;
  } catch {
    return null;
  }
  if (t.sub !== sub || typeof t.iat !== "number" || !Array.isArray(t.ns)) return null;
  const age = now / 1000 - t.iat;
  if (age < -60 || age > ttl) return null;
  return t;
}
