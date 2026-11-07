/** Catalog of calculation tools, grouped by category. Order here is display order. */

export type ToolSlug = "cable-selection" | "voltage-drop" | "transformer-short-circuit";

export interface ToolEntry {
  slug: ToolSlug;
  title: string;
  description: string;
  icon: string;
  tier: "free" | "pro";
}

export interface ToolCategory {
  slug: string;
  title: string;
  description: string;
  icon: string;
  tools: ToolEntry[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: "design",
    title: "תכנון",
    description: "כלים לתכנון מתקני חשמל: בחירת כבלים, מפלי מתח וזרמי קצר.",
    icon: "📐",
    tools: [
      {
        slug: "cable-selection",
        title: "בחירת כבלים לפי שיטות התקנה",
        description: "בחירת חתך כבל נחושת או אלומיניום ובחירת מבטח, לפי שיטת ההתקנה בחוק החשמל (תקנות 2014) או בתקן IEC, כולל מקדמי תיקון ומפל מתח.",
        icon: "🔌",
        tier: "free",
      },
      {
        slug: "voltage-drop",
        title: "חישוב מפלי מתח",
        description: "מפל המתח בקו חד־פאזי או תלת־פאזי לפי חתך, אורך, זרם ומקדם הספק.",
        icon: "📉",
        tier: "free",
      },
      {
        slug: "transformer-short-circuit",
        title: "זרם קצר בשנאי",
        description: "זרם הקצר הסימטרי בהדקי המשני של שנאי לפי ההספק, המתח ומתח הקצר (uk).",
        icon: "⚡",
        tier: "pro",
      },
    ],
  },
];

export function getTool(slug: string): { tool: ToolEntry; category: ToolCategory } | undefined {
  for (const category of TOOL_CATEGORIES) {
    const tool = category.tools.find((t) => t.slug === slug);
    if (tool) return { tool, category };
  }
  return undefined;
}
