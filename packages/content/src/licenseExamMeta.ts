/**
 * The licensing-exam question bank ("מאגר שאלות לבחינות רישוי בחשמל לטכנאים, הנדסאים ומהנדסים",
 * Ministry of Labor). /content/license-exam/bank.json is generated from the official PDF by
 * packages/content/scripts/license-exam/extract.py; answers.json is our own answer key, filled in
 * over time (the ministry publishes questions only).
 *
 * This module has no Node imports, so client components can use it via
 * "@electricademy/content/license-exam"; the loader lives in ./licenseExam.ts.
 */
/** Which licence exam a question can appear in, per the two tables at the end of the bank. */
export type QuestionScope = "all" | "practical-engineer" | "engineer";

/** The licence the learner is studying for. */
export type ExamLevel = "technician" | "practical-engineer" | "engineer";

export const EXAM_LEVELS: Record<ExamLevel, { title: string; short: string; scopes: QuestionScope[] }> = {
  technician: { title: "חשמלאי טכנאי", short: "טכנאי", scopes: ["all"] },
  "practical-engineer": { title: "חשמלאי הנדסאי", short: "הנדסאי", scopes: ["all", "practical-engineer"] },
  engineer: { title: "חשמלאי מהנדס", short: "מהנדס", scopes: ["all", "practical-engineer", "engineer"] },
};

export const SCOPE_LABELS: Record<QuestionScope, string> = {
  all: "כל הרישיונות",
  "practical-engineer": "הנדסאים ומהנדסים",
  engineer: "מהנדסים בלבד",
};

export const isExamLevel = (v: unknown): v is ExamLevel => typeof v === "string" && v in EXAM_LEVELS;

export interface BankFigure {
  /** File name under /images/license-exam/. */
  src: string;
  w: number;
  h: number;
}

export interface BankOption {
  text: string;
  figures: BankFigure[];
  /** The figure is the option itself (a formula cropped from the page); text is only for search. */
  rendered?: boolean;
}

export interface BankQuestion {
  /** Running number in the bank ("שאלה N"). Stable within a bank version. */
  n: number;
  /** The ministry's serial code (green, under the heading). Not unique. */
  serial: string | null;
  level: QuestionScope;
  /** Stem paragraphs (one per PDF line; join with spaces for a single paragraph). */
  stem: string[];
  figures: BankFigure[];
  /** The figures are the whole stem (formulas cropped from the page); text is only for search. */
  stemRendered?: boolean;
  options: BankOption[];
}

export interface BankMeta {
  version: string | null;
  /** Date the PDF was produced, YYYY-MM-DD. */
  published: string | null;
  count: number;
}

export interface AnswerKeyEntry {
  /** 1-based index of the correct option. */
  answer: 1 | 2 | 3 | 4;
  /** The serial printed with the question when the answer was keyed, to catch renumbering. */
  serial: string | null;
  explanation?: string;
  /** Where the answer comes from, e.g. a regulation section ("תקנות הארקות, תקנה 12"). */
  source?: string;
}

/* ───────────── Topics (keyword rules over stem + options) ───────────── */

export type ExamTopic =
  | "earthing"
  | "protection"
  | "cables"
  | "switchboards"
  | "transformers-hv"
  | "generators"
  | "renewables"
  | "lighting"
  | "special-sites"
  | "live-work"
  | "power-quality"
  | "general";

export const EXAM_TOPICS: Record<ExamTopic, { title: string; law?: string }> = {
  earthing: { title: "הארקות והגנה בפני חישמול", law: "earthing-and-shock-protection" },
  protection: { title: "מפסקים, מבטחים והגנות", law: "conductor-loading-and-protection" },
  cables: { title: "כבלים, מוליכים ומובלים", law: "lv-cables" },
  switchboards: { title: "לוחות חשמל", law: "switchboards" },
  "transformers-hv": { title: "שנאים, מתח גבוה ורשתות", law: "hv-cables" },
  generators: { title: "גנרטורים, אל־פסק ומנועים", law: "lv-generators" },
  renewables: { title: "סולארי, אגירה וטעינת רכבים" },
  lighting: { title: "תאורה" },
  "special-sites": { title: "אתרים ומתקנים מיוחדים", law: "medical-sites" },
  "live-work": { title: "עבודה במתקן חי, רישוי ובטיחות", law: "live-work" },
  "power-quality": { title: "איכות חשמל, הרמוניות וקבלים" },
  general: { title: "כללי" },
};

/** First matching weight wins ties; order is from the most specific topic to the broadest. */
const TOPIC_RULES: [ExamTopic, RegExp][] = [
  ["renewables", /סולאר|פוטו[-־ ]?וולט|\bPV\b|אגירה|סוללות|BESS|טעינ|רכב(?:ים)? חשמלי|ממיר|אגרו|מתקן ייצור|הגבלת הזרמת/g],
  ["power-quality", /הרמוני|עיוות|THD|קבלים|סוללת קבלים|כופל הספק|מקדם הספק|cos\s?φ|גורם הספק|איכות חשמל|הספק ריאקטיבי|kVAr/gi],
  ["live-work", /מתקן חי|עבודה בקרבת|ציוד בטיחות|ציוד מגן|כפפות|ביגוד|בגדי|רישיון|רשאי|מורשה|בודק|השגחה|פיקוח|הוראות בכתב|חוק החשמל/g],
  ["special-sites", /רפואי|ניתוח|רנטגן|בריכ|אמבט|מקלחת|אתר בני|מתקן ארעי|חקלאי|נפיץ|רב[-־ ]?קומות|דרך המילוט|מאגר מים|רמזור|מעלית/g],
  ["lighting", /תאור|גופי? תאורה|נורות?|(?<![א-ת])לד(?![א-ת])|LED|lux|לוקס|הארה|פלורסנט/g],
  ["generators", /גנרטור|אל[-־ ]?פסק|UPS|(?<![לא-ת])מנוע|המנוע|מתנע|מערכת החלפה|זינה חלופית|אספקה חלופית/g],
  ["transformers-hv", /שנאי|מתח גבוה|מ"ג|\bkV\b|תחנת? (?:השנאה|משנה)|מנתק|מסדר|קו(?:ו)?י? עילי|פטרסון|ממסר|רשת(?: חשמל)? עילית|קו בזק|עמוד|קורונה|התפרקויות|מבודד/g],
  ["switchboards", /לוח(?:ות)?(?: חשמל| ראשי| משנה| ציבורי)?|פס(?:י)? צבירה|61439|מידור/g],
  ["cables", /כבל|מוליכ|חתך|ממ"ר|מובל|צינור|תעל|סולם כבלים|N2XY|NYY|מגש|צבע הבידוד|תיבת? (?:חיבורים|הסתעפות)|PEN/g],
  ["protection", /מפסק|מא"ז|מבטח|נתיך|קצר|העמסת יתר|סלקטיבי|אופיין|כושר (?:ניתוק|הפסקה)|זרם נקוב|ברק/g],
  ["earthing", /הארק|איפוס|\bTN(?:-[CS])*\b|\bTT\b|\bIT\b|חישמול|חשמול|השוואת פוטנציאל|מפסק מגן|זרם דלף|פחת|זינה צפה|מתח מגע|לולאת התקלה|אלקטרוד/g],
];

function topicScores(text: string): Map<ExamTopic, number> {
  const scores = new Map<ExamTopic, number>();
  for (const [topic, re] of TOPIC_RULES) {
    const hits = text.match(re)?.length ?? 0;
    if (hits) scores.set(topic, hits);
  }
  return scores;
}

export function questionText(q: Pick<BankQuestion, "stem" | "options">): string {
  return [...q.stem, ...q.options.map((o) => o.text)].join(" ");
}

/** The topic with the most keyword hits, weighting the stem double. */
export function classifyQuestion(q: Pick<BankQuestion, "stem" | "options">): ExamTopic {
  const stem = topicScores(q.stem.join(" "));
  const all = topicScores(questionText(q));
  let best: ExamTopic = "general";
  let bestScore = 0;
  for (const [topic] of TOPIC_RULES) {
    const score = (stem.get(topic) ?? 0) * 2 + (all.get(topic) ?? 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}

/** Fisher–Yates sample of `count` distinct items. `random` is injectable for tests. */
export function sample<T>(items: readonly T[], count: number, random: () => number = Math.random): T[] {
  const pool = items.slice();
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, n);
}

/** Lower-cased, punctuation-free text for search ("איפוס tn-c-s" finds "TN-C-S"). */
export function searchKey(s: string): string {
  return s.toLowerCase().replace(/["'״׳.,:;?!()\[\]]/g, "").replace(/\s+/g, " ");
}
