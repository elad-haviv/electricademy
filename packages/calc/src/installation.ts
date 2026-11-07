import type { StandardSection } from "./constants";

/**
 * Reference installation methods of IEC 60364-5-52 (Annex B) supported by the
 * cable-selection tool.
 */
export type InstallationMethod = "A1" | "A2" | "B1" | "B2" | "C" | "D1" | "D2" | "E";

export interface InstallationMethodInfo {
  method: InstallationMethod;
  /** Short Hebrew label. */
  label: string;
  /** Hebrew description of the typical installation. */
  description: string;
  /** Where the reference temperature is measured: surrounding air (30°C) or ground (20°C). */
  medium: "air" | "ground";
}

export const INSTALLATION_METHODS: readonly InstallationMethodInfo[] = [
  { method: "A1", label: "A1 – מוליכים בצינור בקיר מבודד", description: "מוליכים בודדים בצינור בתוך קיר מבודד תרמית", medium: "air" },
  { method: "A2", label: "A2 – כבל רב־גידי בצינור בקיר מבודד", description: "כבל רב־גידי בצינור בתוך קיר מבודד תרמית", medium: "air" },
  { method: "B1", label: "B1 – מוליכים בצינור על קיר", description: "מוליכים בודדים בצינור או בתעלה על קיר או בתוכו (לא מבודד)", medium: "air" },
  { method: "B2", label: "B2 – כבל רב־גידי בצינור על קיר", description: "כבל רב־גידי בצינור או בתעלה על קיר", medium: "air" },
  { method: "C", label: "C – כבל מחוזק ישירות לקיר", description: "כבל חד או רב־גידי מחוזק ישירות על קיר או תקרה, או על מגש לא מחורר", medium: "air" },
  { method: "E", label: "E – כבל רב־גידי באוויר חופשי", description: "כבל רב־גידי על מגש מחורר, סולם כבלים או תליה, במרחק מהקיר", medium: "air" },
  { method: "D1", label: "D1 – כבל בצינור טמון באדמה", description: "כבל רב־גידי בצינור או בשרוול טמון באדמה", medium: "ground" },
  { method: "D2", label: "D2 – כבל טמון ישירות באדמה", description: "כבל רב־גידי מוגן הטמון ישירות באדמה", medium: "ground" },
];

type AmpacityTable = Record<StandardSection, number>;

/**
 * Current-carrying capacity (A) of copper, PVC-insulated (70°C) cables per
 * reference installation method and number of loaded conductors.
 * Reference temperature: 30°C ambient air; 20°C ground (2.5 K·m/W) for D1/D2.
 * Source: IEC 60364-5-52 Tables B.52.2, B.52.4 and B.52.10 (educational reference values).
 */
export const AMPACITY_CU_PVC: Record<InstallationMethod, Record<2 | 3, AmpacityTable>> = {
  A1: {
    2: { 1.5: 15.5, 2.5: 19.5, 4: 26, 6: 34, 10: 46, 16: 61, 25: 80, 35: 99, 50: 119, 70: 151, 95: 182, 120: 210, 150: 240, 185: 273, 240: 321 },
    3: { 1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 89, 50: 108, 70: 136, 95: 164, 120: 188, 150: 216, 185: 245, 240: 286 },
  },
  A2: {
    2: { 1.5: 15.5, 2.5: 18.5, 4: 25, 6: 32, 10: 43, 16: 57, 25: 75, 35: 92, 50: 110, 70: 139, 95: 167, 120: 192, 150: 219, 185: 248, 240: 291 },
    3: { 1.5: 13, 2.5: 17.5, 4: 23, 6: 29, 10: 39, 16: 52, 25: 68, 35: 83, 50: 99, 70: 125, 95: 150, 120: 172, 150: 196, 185: 223, 240: 261 },
  },
  B1: {
    2: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151, 70: 192, 95: 232, 120: 269, 150: 300, 185: 341, 240: 400 },
    3: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239, 150: 262, 185: 296, 240: 346 },
  },
  B2: {
    2: { 1.5: 16.5, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 90, 35: 111, 50: 133, 70: 168, 95: 201, 120: 232, 150: 258, 185: 294, 240: 344 },
    3: { 1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99, 50: 118, 70: 149, 95: 179, 120: 206, 150: 225, 185: 255, 240: 297 },
  },
  C: {
    2: { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168, 70: 213, 95: 258, 120: 299, 150: 344, 185: 392, 240: 461 },
    3: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119, 50: 144, 70: 184, 95: 223, 120: 259, 150: 299, 185: 341, 240: 403 },
  },
  D1: {
    2: { 1.5: 22, 2.5: 29, 4: 37, 6: 46, 10: 60, 16: 78, 25: 99, 35: 119, 50: 140, 70: 173, 95: 204, 120: 231, 150: 261, 185: 292, 240: 336 },
    3: { 1.5: 18, 2.5: 24, 4: 30, 6: 38, 10: 50, 16: 64, 25: 82, 35: 98, 50: 116, 70: 143, 95: 169, 120: 192, 150: 217, 185: 243, 240: 280 },
  },
  D2: {
    2: { 1.5: 22, 2.5: 28, 4: 38, 6: 48, 10: 64, 16: 83, 25: 110, 35: 132, 50: 156, 70: 192, 95: 230, 120: 261, 150: 293, 185: 331, 240: 382 },
    3: { 1.5: 19, 2.5: 24, 4: 33, 6: 41, 10: 54, 16: 70, 25: 92, 35: 110, 50: 130, 70: 162, 95: 193, 120: 220, 150: 246, 185: 278, 240: 320 },
  },
  E: {
    2: { 1.5: 22, 2.5: 30, 4: 40, 6: 51, 10: 70, 16: 94, 25: 119, 35: 148, 50: 180, 70: 232, 95: 282, 120: 328, 150: 379, 185: 434, 240: 514 },
    3: { 1.5: 18.5, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 101, 35: 126, 50: 153, 70: 196, 95: 238, 120: 276, 150: 319, 185: 364, 240: 430 },
  },
};

/** Reference method C (clipped direct), kept for backwards compatibility. */
export const AMPACITY_CU_PVC_METHOD_C = AMPACITY_CU_PVC.C;

/** Ambient air temperature correction for PVC (70°C) insulation, reference 30°C (IEC 60364-5-52 Table B.52.14). */
const AIR_TEMPERATURE_FACTORS_PVC: Record<number, number> = {
  10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.5,
};

/** Ground temperature correction for PVC (70°C) insulation, reference 20°C (IEC 60364-5-52 Table B.52.15). */
const GROUND_TEMPERATURE_FACTORS_PVC: Record<number, number> = {
  10: 1.1, 15: 1.05, 20: 1, 25: 0.95, 30: 0.89, 35: 0.84, 40: 0.77, 45: 0.71, 50: 0.63, 55: 0.55, 60: 0.45,
};

/** Temperatures (°C) for which a correction factor is tabulated. */
export const TABULATED_TEMPERATURES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;

/** Reference temperature (°C) for the given installation method. */
export function referenceTemperature(method: InstallationMethod): number {
  return methodInfo(method).medium === "ground" ? 20 : 30;
}

export function methodInfo(method: InstallationMethod): InstallationMethodInfo {
  const info = INSTALLATION_METHODS.find((m) => m.method === method);
  if (!info) throw new Error(`Unknown installation method: ${method}`);
  return info;
}

/** Temperature correction factor for PVC insulation; non-tabulated temperatures round up (conservative). */
export function temperatureFactor(method: InstallationMethod, temperatureC: number): number {
  const table = methodInfo(method).medium === "ground" ? GROUND_TEMPERATURE_FACTORS_PVC : AIR_TEMPERATURE_FACTORS_PVC;
  const key = TABULATED_TEMPERATURES.find((t) => t >= temperatureC);
  if (key === undefined) throw new Error("Temperature above 60°C is outside the PVC table");
  return table[key]!;
}

/**
 * Grouping factor for circuits bunched in air, on a surface, embedded or enclosed
 * (IEC 60364-5-52 Table B.52.17, item 1). Non-tabulated counts round up (conservative).
 */
const GROUPING_FACTORS: [count: number, factor: number][] = [
  [1, 1], [2, 0.8], [3, 0.7], [4, 0.65], [5, 0.6], [6, 0.57], [7, 0.54], [8, 0.52], [9, 0.5], [12, 0.45], [16, 0.41], [20, 0.38],
];

export function groupingFactor(circuits: number): number {
  if (!Number.isInteger(circuits) || circuits < 1) throw new Error("circuits must be a positive integer");
  const row = GROUPING_FACTORS.find(([n]) => n >= circuits);
  return row ? row[1] : GROUPING_FACTORS[GROUPING_FACTORS.length - 1]![1];
}
