/** Hebrew UI labels for enum-like values. */
export const LEVEL_LABELS: Record<string, string> = {
  basics: "בסיס",
  bagrut: "בגרות",
  technician: "טכנאי / הנדסאי",
  academic: "אקדמי",
  licensing: "רישוי",
  professional: "מקצועי",
};

export const COMMUNITY_TAGS: Record<string, string> = {
  general: "כללי",
  basics: "יסודות",
  bagrut: "בגרות",
  mahat: "מה\"ט",
  academic: "תואר",
  licensing: "רישוי",
  installations: "מתקנים",
  "power-systems": "מערכות הספק",
  regulations: "תקנות",
};

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(new Date(d));
}
