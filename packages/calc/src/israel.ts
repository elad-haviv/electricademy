/**
 * Cable ampacity per the Israeli Electricity Regulations:
 * תקנות החשמל (העמסה והגנה על מוליכים מבודדים וכבלים במתח נמוך), התשע״ד–2014.
 *
 * - Third schedule (תוספת שלישית): installation methods א׳–ל״א and the Iz table each one uses.
 * - Second schedule (תוספת שנייה): Iz tables 70.1–70.8 (70°C insulation) and 90.1–90.8 (90°C).
 *   Reference: 35°C ambient air; 30°C ground and 2.5 K·m/W soil for methods ל׳, ל״א.
 * - First schedule (תוספת ראשונה): correction factors (tables 1–7). I'z = Iz · c (regulation 6).
 *
 * Only the copper columns are included.
 */

export type IlInsulation = 70 | 90;
export type IlTableNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type IlGroupingKind = "air" | "buried-direct" | "buried-duct";

export interface IlInstallationMethod {
  /** Stable id, e.g. "א", "יח-א". */
  id: string;
  /** Display code, e.g. "א׳", "י״ח (א)". */
  code: string;
  description: string;
  /** Number of the Iz table in the second schedule (70.n / 90.n). */
  table: IlTableNumber;
  medium: "air" | "ground";
  grouping: IlGroupingKind;
}

const m = (
  id: string, code: string, table: IlTableNumber, description: string,
  medium: "air" | "ground" = "air", grouping: IlGroupingKind = "air",
): IlInstallationMethod => ({ id, code, table, description, medium, grouping });

/** Installation methods of the third schedule (תוספת שלישית), in order. */
export const IL_INSTALLATION_METHODS: readonly IlInstallationMethod[] = [
  m("א", "א׳", 1, "מוליכים מבודדים או כבלים חד־גידיים בצינור שבקיר, עם בידוד תרמי"),
  m("ב", "ב׳", 2, "כבלים רב־גידיים בצינור שבקיר, עם בידוד תרמי"),
  m("ג", "ג׳", 3, "מוליכים מבודדים או כבלים חד־גידיים במוביל שעל גבי קיר, או בהתקנה באמצעות חבקים (עד 0.3 קוטר הכבל מהקיר)"),
  m("ד", "ד׳", 4, "כבלים רב־גידיים במוביל שעל גבי קיר, או בהתקנה באמצעות חבקים (עד 0.3 קוטר הכבל מהקיר)"),
  m("ה", "ה׳", 3, "מוליכים מבודדים או כבלים חד־גידיים בתוך תעלה על גבי קיר"),
  m("ו", "ו׳", 4, "כבלים רב־גידיים בתוך תעלה על גבי קיר"),
  m("ז", "ז׳", 3, "מוליכים מבודדים או כבלים חד־גידיים בתוך תעלה תלויה"),
  m("ח", "ח׳", 4, "כבלים רב־גידיים בתוך תעלה תלויה"),
  m("ט", "ט׳", 3, "מוליכים מבודדים או כבלים חד־גידיים בתוך תעלה חשופה המשמשת גם שירותים אחרים"),
  m("י", "י׳", 4, "כבלים רב־גידיים בתעלה חשופה המשמשת גם שירותים אחרים"),
  m("יא", "י״א", 1, "כבלים חד־גידיים או רב־גידיים בתוך משקוף של דלת או חלון"),
  m("יב", "י״ב", 5, "כבלים חד־גידיים או רב־גידיים בצמוד לקיר או לתקרה"),
  m("יג", "י״ג", 5, "כבלים חד־גידיים או רב־גידיים על גבי מגש לא מחורר"),
  m("יד", "י״ד", 7, "כבלים רב־גידיים על גבי מגש מחורר או מגש רשת"),
  m("טו", "ט״ו", 8, "כבלים חד־גידיים על גבי מגש מחורר או מגש רשת"),
  m("טז", "ט״ז", 7, "כבלים רב־גידיים על גבי סולם כבלים"),
  m("יז", "י״ז", 8, "כבלים חד־גידיים על גבי סולם כבלים"),
  m("יח-א", "י״ח (א)", 4, "כבלים בחלל בנוי בתוך מבנה, כאשר 1.5De ≤ V < 5De"),
  m("יח-ב", "י״ח (ב)", 3, "כבלים בחלל בנוי בתוך מבנה, כאשר 5De ≤ V ≤ 50De"),
  m("יט-א", "י״ט (א)", 4, "כבלים בתקרה כפולה או ברצפה כפולה (צפה), כאשר 1.5De ≤ V < 5De"),
  m("יט-ב", "י״ט (ב)", 3, "כבלים בתקרה כפולה או ברצפה כפולה (צפה), כאשר 5De ≤ V ≤ 50De"),
  m("כ", "כ׳", 3, "כבל חד־גידי בתוך תעלה משוקעת ברצפה; המכסה בלא פתחי אוורור"),
  m("כא", "כ״א", 4, "כבלים רב־גידיים בתוך תעלה משוקעת ברצפה; המכסה בלא פתחי אוורור"),
  m("כב", "כ״ב", 3, "כבלים חד־גידיים בתעלה משוקעת בתוך קיר; המכסה בלא פתחי אוורור"),
  m("כג", "כ״ג", 4, "כבלים רב־גידיים בתעלה משוקעת בתוך קיר; המכסה בלא פתחי אוורור"),
  m("כד-א", "כ״ד (א)", 4, "מוליכים מבודדים בצינור בתעלה בלא אוורור, בהתקנה אופקית, כאשר 1.5De ≤ V < 20De"),
  m("כד-ב", "כ״ד (ב)", 3, "מוליכים מבודדים בצינור בתעלה בלא אוורור, בהתקנה אופקית, כאשר V ≥ 20De"),
  m("כה", "כ״ה", 3, "מוליכים מבודדים בצינור בתעלת כבלים ברצפה, פתוחה או עם מכסה מאוורר"),
  m("כו", "כ״ו", 4, "כבלים רב־גידיים בצינור בתעלת כבלים ברצפה, פתוחה או עם מכסה מאוורר"),
  m("כז", "כ״ז", 3, "כבלים חד־גידיים או רב־גידיים בתעלת כבלים אופקית או אנכית, פתוחה או עם מכסה מאוורר"),
  m("כח", "כ״ח", 3, "מוליכים מבודדים או כבלים חד־גידיים בצינור בתוך קיר"),
  m("כט", "כ״ט", 4, "כבלים רב־גידיים בצינור בתוך קיר"),
  m("ל", "ל׳", 6, "כבלים חד־גידיים או רב־גידיים בצינור או בתעלה בנויה בתוך האדמה", "ground", "buried-duct"),
  m("לא", "ל״א", 6, "כבלים חד־גידיים או רב־גידיים טמונים באדמה במישרין, עם או בלי כיסוי מגן", "ground", "buried-direct"),
];

/**
 * Copper Iz (A) per insulation and table: rows of [section mm², single-phase circuit, three-phase circuit].
 * Second schedule (תוספת שנייה), tables 70.1–70.8 and 90.1–90.8.
 */
export const IL_AMPACITY_CU: Record<IlInsulation, Record<IlTableNumber, readonly (readonly [number, number, number])[]>> = {
  70: {
    1: [[1.5, 14, 13], [2.5, 18, 17], [4, 24, 23], [6, 32, 29], [10, 43, 39], [16, 57, 53], [25, 75, 69], [35, 93, 84], [50, 112, 102], [70, 142, 128], [95, 171, 154], [120, 197, 177], [150, 226, 203], [185, 257, 230], [240, 302, 269], [300, 345, 308]],
    2: [[1.5, 13, 12], [2.5, 17, 16], [4, 24, 22], [6, 30, 27], [10, 40, 37], [16, 54, 49], [25, 71, 64], [35, 86, 78], [50, 103, 93], [70, 131, 118], [95, 157, 141], [120, 180, 162], [150, 206, 184], [185, 233, 210], [240, 274, 245], [300, 314, 280]],
    3: [[1.5, 16, 15], [2.5, 23, 20], [4, 30, 26], [6, 39, 34], [10, 54, 47], [16, 71, 64], [25, 95, 84], [35, 118, 103], [50, 142, 126], [70, 180, 161], [95, 218, 195], [120, 253, 225]],
    4: [[1.5, 16, 14], [2.5, 22, 19], [4, 28, 25], [6, 36, 32], [10, 49, 43], [16, 65, 58], [25, 85, 75], [35, 104, 93], [50, 125, 111], [70, 158, 140], [95, 189, 168], [120, 218, 194]],
    5: [[1.5, 18, 16], [2.5, 25, 23], [4, 34, 30], [6, 43, 39], [10, 59, 54], [16, 80, 71], [25, 105, 90], [35, 130, 112], [50, 158, 135], [70, 200, 173], [95, 243, 210], [120, 281, 243], [150, 323, 281], [185, 368, 321], [240, 433, 379], [300, 498, 436]],
    6: [[1.5, 20, 16], [2.5, 26, 21], [4, 34, 28], [6, 42, 35], [10, 56, 46], [16, 72, 60], [25, 93, 77], [35, 111, 92], [50, 132, 109], [70, 163, 134], [95, 192, 159], [120, 219, 181], [150, 247, 205], [185, 278, 230], [240, 321, 264], [300, 363, 299]],
    7: [[1.5, 21, 17], [2.5, 28, 24], [4, 38, 32], [6, 48, 40], [10, 66, 56], [16, 88, 75], [25, 112, 95], [35, 139, 118], [50, 169, 144], [70, 218, 184], [95, 265, 224], [120, 308, 259], [150, 356, 300], [185, 408, 342], [240, 483, 404], [300, 557, 467]],
    8: [[25, 123, 103], [35, 152, 129], [50, 184, 157], [70, 236, 203], [95, 286, 248], [120, 331, 290], [150, 382, 335], [185, 435, 384], [240, 513, 456], [300, 591, 527], [400, 709, 617], [500, 816, 704], [630, 945, 804]],
  },
  90: {
    1: [[1.5, 18, 16], [2.5, 25, 22], [4, 34, 30], [6, 43, 38], [10, 59, 52], [16, 78, 70], [25, 102, 91], [35, 126, 112], [50, 152, 135], [70, 192, 172], [95, 231, 207], [120, 267, 239], [150, 305, 274], [185, 348, 311], [240, 407, 365], [300, 467, 418]],
    2: [[1.5, 18, 16], [2.5, 24, 21], [4, 32, 29], [6, 40, 36], [10, 55, 49], [16, 73, 65], [25, 95, 85], [35, 116, 105], [50, 139, 125], [70, 176, 157], [95, 211, 189], [120, 243, 218], [150, 278, 249], [185, 316, 283], [240, 371, 332], [300, 424, 380]],
    3: [[1.5, 22, 19], [2.5, 30, 27], [4, 40, 36], [6, 52, 46], [10, 72, 63], [16, 96, 84], [25, 128, 112], [35, 157, 138], [50, 190, 168], [70, 243, 213], [95, 294, 258], [120, 340, 300]],
    4: [[1.5, 21, 19], [2.5, 29, 25], [4, 38, 34], [6, 49, 42], [10, 66, 58], [16, 87, 77], [25, 114, 101], [35, 140, 123], [50, 168, 148], [70, 212, 186], [95, 254, 224], [120, 293, 257]],
    5: [[1.5, 23, 21], [2.5, 32, 29], [4, 43, 38], [6, 56, 50], [10, 77, 68], [16, 103, 92], [25, 132, 114], [35, 164, 141], [50, 201, 172], [70, 258, 220], [95, 315, 267], [120, 367, 309], [150, 423, 356], [185, 486, 407], [240, 575, 480], [300, 665, 553]],
    6: [[1.5, 24, 20], [2.5, 32, 27], [4, 41, 34], [6, 52, 43], [10, 68, 57], [16, 88, 73], [25, 113, 94], [35, 136, 113], [50, 161, 134], [70, 198, 166], [95, 234, 196], [120, 267, 223], [150, 301, 252], [185, 338, 283], [240, 390, 326], [300, 441, 368]],
    7: [[1.5, 25, 22], [2.5, 35, 31], [4, 47, 40], [6, 60, 52], [10, 83, 72], [16, 110, 96], [25, 143, 122], [35, 178, 152], [50, 216, 184], [70, 277, 236], [95, 338, 286], [120, 394, 332], [150, 454, 383], [185, 520, 438], [240, 615, 516], [300, 711, 596]],
    8: [[25, 155, 130], [35, 192, 162], [50, 232, 199], [70, 298, 257], [95, 362, 315], [120, 420, 368], [150, 484, 426], [185, 552, 490], [240, 652, 583], [300, 752, 675], [400, 902, 790], [500, 1040, 908], [630, 1204, 1044]],
  },
};

/** Reference ambient temperature (°C): 35 in air, 30 in ground. */
export function ilReferenceTemperature(medium: "air" | "ground"): number {
  return medium === "ground" ? 30 : 35;
}

/** First schedule, tables 1 (air) and 2 (ground): [°C, factor for 70°C insulation, factor for 90°C insulation]. */
const IL_AIR_TEMPERATURE: readonly (readonly [number, number | null, number])[] = [
  [10, 1.3, 1.2], [15, 1.24, 1.17], [20, 1.19, 1.13], [25, 1.13, 1.08], [30, 1.06, 1.04], [35, 1, 1],
  [40, 0.93, 0.95], [45, 0.84, 0.91], [50, 0.76, 0.85], [55, 0.65, 0.79], [60, 0.53, 0.74],
  [65, null, 0.68], [70, null, 0.6], [75, null, 0.52], [80, null, 0.43],
];
const IL_GROUND_TEMPERATURE: readonly (readonly [number, number | null, number])[] = [
  [10, 1.24, 1.15], [15, 1.18, 1.12], [20, 1.12, 1.08], [25, 1.07, 1.03], [30, 1, 1], [35, 0.94, 0.96],
  [40, 0.87, 0.91], [45, 0.8, 0.86], [50, 0.71, 0.82], [55, 0.62, 0.76], [60, 0.51, 0.7],
  [65, null, 0.65], [70, null, 0.57], [75, null, 0.49], [80, null, 0.41],
];

/** Temperatures (°C) that have a tabulated factor for the given insulation. */
export function ilTabulatedTemperatures(insulation: IlInsulation): number[] {
  return IL_AIR_TEMPERATURE.filter((r) => (insulation === 70 ? r[1] !== null : true)).map((r) => r[0]);
}

/** Temperature correction factor (tables 1–2); non-tabulated temperatures round up (conservative). */
export function ilTemperatureFactor(medium: "air" | "ground", insulation: IlInsulation, temperatureC: number): number {
  const table = medium === "ground" ? IL_GROUND_TEMPERATURE : IL_AIR_TEMPERATURE;
  const row = table.find((r) => r[0] >= temperatureC);
  const factor = row && (insulation === 70 ? row[1] : row[2]);
  if (factor == null) throw new Error(`Temperature ${temperatureC}°C is outside the table for ${insulation}°C insulation`);
  return factor;
}

/** First schedule, table 3: soil thermal resistivity (K·m/W) → factor. Applies to method ל״א only (note 4). */
export const IL_SOIL_RESISTIVITY_FACTORS: readonly (readonly [number, number])[] = [
  [1, 1.18], [1.5, 1.1], [2, 1.05], [2.5, 1], [3, 0.96],
];

export function ilSoilFactor(resistivity: number): number {
  const row = IL_SOIL_RESISTIVITY_FACTORS.find(([r]) => r >= resistivity);
  if (!row) throw new Error("Soil thermal resistivity above 3 K·m/W is outside table 3");
  return row[1];
}

export interface IlGroupingArrangement {
  id: string;
  /** Hebrew label including the source table. */
  label: string;
  kind: IlGroupingKind;
  /** Column headings for spacing between circuits; a single column when spacing does not apply. */
  spacings: readonly string[];
  /** [number of circuits, factor per spacing column]. */
  rows: readonly (readonly [number, readonly number[]])[];
}

const single = (values: number[], counts: number[]) => counts.map((n, i) => [n, [values[i]!]] as const);
const T4_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20];
const T4_COUNTS_9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** First schedule, tables 4–7: grouping factors. */
export const IL_GROUPING_ARRANGEMENTS: readonly IlGroupingArrangement[] = [
  { id: "t4-1", kind: "air", label: "מקבץ כבלים באוויר, על משטח, סמוי או חשוף (טבלה 4, שורה 1)", spacings: ["צמודים"],
    rows: single([1, 0.8, 0.7, 0.65, 0.6, 0.57, 0.54, 0.52, 0.5, 0.45, 0.41, 0.38], T4_COUNTS) },
  { id: "t4-2", kind: "air", label: "שכבה אחת על קיר, רצפה או מגש לא מחורר (טבלה 4, שורה 2)", spacings: ["צמודים"],
    rows: single([1, 0.85, 0.79, 0.75, 0.73, 0.72, 0.72, 0.71, 0.7], T4_COUNTS_9) },
  { id: "t4-3", kind: "air", label: "שכבה אחת בצמוד לתקרה (טבלה 4, שורה 3)", spacings: ["צמודים"],
    rows: single([0.95, 0.81, 0.72, 0.68, 0.66, 0.64, 0.63, 0.62, 0.61], T4_COUNTS_9) },
  { id: "t4-4", kind: "air", label: "שכבה אחת על מגש מחורר אופקי או אנכי (טבלה 4, שורה 4)", spacings: ["צמודים"],
    rows: single([1, 0.88, 0.82, 0.77, 0.75, 0.73, 0.73, 0.72, 0.72], T4_COUNTS_9) },
  { id: "t4-5", kind: "air", label: "שכבה אחת על סולם או בחבקים (טבלה 4, שורה 5)", spacings: ["צמודים"],
    rows: single([1, 0.87, 0.82, 0.8, 0.8, 0.79, 0.79, 0.78, 0.78], T4_COUNTS_9) },
  { id: "t5", kind: "buried-direct", label: "כבלים טמונים במישרין באדמה (טבלה 5)",
    spacings: ["צמודים", "a = De", "12.5 ס״מ", "25 ס״מ", "50 ס״מ"],
    rows: [[2, [0.75, 0.8, 0.85, 0.9, 0.9]], [3, [0.65, 0.7, 0.75, 0.8, 0.85]], [4, [0.6, 0.6, 0.7, 0.75, 0.8]],
      [5, [0.55, 0.55, 0.65, 0.7, 0.8]], [6, [0.5, 0.55, 0.6, 0.7, 0.8]]] },
  { id: "t6", kind: "buried-duct", label: "כבלים חד־גידיים בצינורות באדמה, כבל בכל צינור (טבלה 6)",
    spacings: ["צמודים", "25 ס״מ", "50 ס״מ", "100 ס״מ"],
    rows: [[2, [0.8, 0.9, 0.9, 0.95]], [3, [0.7, 0.8, 0.85, 0.9]], [4, [0.65, 0.75, 0.8, 0.9]],
      [5, [0.6, 0.7, 0.8, 0.9]], [6, [0.6, 0.7, 0.8, 0.9]]] },
  { id: "t7", kind: "buried-duct", label: "כבלים רב־גידיים בצינורות באדמה, כבל בכל צינור (טבלה 7)",
    spacings: ["צמודים", "25 ס״מ", "50 ס״מ", "100 ס״מ"],
    rows: [[2, [0.85, 0.9, 0.95, 0.95]], [3, [0.75, 0.85, 0.9, 0.95]], [4, [0.7, 0.8, 0.85, 0.9]],
      [5, [0.65, 0.8, 0.85, 0.9]], [6, [0.6, 0.8, 0.8, 0.9]]] },
];

export function ilMethod(id: string): IlInstallationMethod {
  const method = IL_INSTALLATION_METHODS.find((x) => x.id === id);
  if (!method) throw new Error(`Unknown installation method: ${id}`);
  return method;
}

export interface IlGroupingInput {
  arrangement: string;
  circuits: number;
  /** Index into the arrangement's spacing columns. Defaults to 0. */
  spacing?: number;
}

/**
 * Grouping factor from tables 4–7. A single circuit gives 1 (except table 4 row 3, whose
 * single-circuit value is 0.95). Throws if the count is not tabulated.
 */
export function ilGroupingFactor({ arrangement, circuits, spacing = 0 }: IlGroupingInput): number {
  const arr = IL_GROUPING_ARRANGEMENTS.find((a) => a.id === arrangement);
  if (!arr) throw new Error(`Unknown grouping arrangement: ${arrangement}`);
  if (!Number.isInteger(circuits) || circuits < 1) throw new Error("circuits must be a positive integer");
  if (circuits === 1 && arr.rows[0]![0] !== 1) return 1;
  const row = arr.rows.find(([n]) => n >= circuits);
  if (!row) throw new Error(`Table allows at most ${arr.rows[arr.rows.length - 1]![0]} circuits`);
  const factor = row[1][spacing];
  if (factor === undefined) throw new Error("Invalid spacing column");
  return factor;
}
