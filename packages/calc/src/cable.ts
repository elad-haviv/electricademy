import {
  RESISTIVITY_20C,
  STANDARD_SECTIONS_MM2,
  TEMP_COEFFICIENT,
  type ConductorMaterial,
} from "./constants";
import type { Phases } from "./basic";
import { assertPositive } from "./validate";
import {
  ProtectionResult,
  selectProtection,
  smallestDevice,
  type ProtectionRules,
  type ProtectiveDeviceType,
} from "./protection";
import {
  ilGroupingFactor,
  ilMethod,
  ilRatings,
  ilReferenceTemperature,
  ilSoilFactor,
  ilTemperatureFactor,
  type IlGroupingInput,
  type IlInsulation,
} from "./israel";
import {
  AMPACITY_CU_PVC,
  groupingFactor,
  referenceTemperature,
  temperatureFactor,
  type InstallationMethod,
} from "./installation";

/** Conductor resistivity (Ω·mm²/m) corrected to the given temperature. */
export function resistivityAt(material: ConductorMaterial, temperatureC = 20): number {
  return RESISTIVITY_20C[material] * (1 + TEMP_COEFFICIENT[material] * (temperatureC - 20));
}

export interface VoltageDropInput {
  phases: Phases;
  /** Nominal voltage: phase-to-neutral for single-phase, line-to-line for three-phase (V). */
  voltage: number;
  /** Load current (A). */
  current: number;
  /** One-way cable length (m). */
  length: number;
  /** Conductor cross-section (mm²). */
  section: number;
  material?: ConductorMaterial;
  powerFactor?: number;
  /** Conductor temperature for resistance (°C). Defaults to 70°C (PVC operating temperature). */
  conductorTemperature?: number;
  /** Line reactance (Ω/km). Defaults to 0.08 Ω/km, typical for multicore LV cables. */
  reactancePerKm?: number;
}

/**
 * Voltage drop using ΔU = k·I·L·(R·cosφ + X·sinφ),
 * with k = 2 for single-phase (go and return) and √3 for three-phase.
 */
export function voltageDrop(input: VoltageDropInput) {
  const {
    phases, voltage, current, length, section,
    material = "copper", powerFactor = 1, conductorTemperature = 70, reactancePerKm = 0.08,
  } = input;
  assertPositive(voltage, "voltage");
  assertPositive(length, "length");
  assertPositive(section, "section");
  if (current < 0) throw new Error("current must not be negative");
  if (powerFactor < 0 || powerFactor > 1) throw new Error("powerFactor must be between 0 and 1");

  const rPerM = resistivityAt(material, conductorTemperature) / section;
  const xPerM = reactancePerKm / 1000;
  const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
  const k = phases === 3 ? Math.sqrt(3) : 2;
  const volts = k * current * length * (rPerM * powerFactor + xPerM * sinPhi);
  return { volts, percent: (volts / voltage) * 100 };
}

interface SectionSelectionInput extends Omit<VoltageDropInput, "section"> {
  /** Maximum allowed voltage drop (%). */
  maxDropPercent: number;
  /**
   * Overload protective device. When given, a section is accepted only if a device of this type
   * satisfies Ib ≤ In ≤ I'z and I2 ≤ 1.45·I'z; otherwise only Ib ≤ I'z is checked.
   */
  protection?: ProtectiveDeviceType;
}

export interface CableSizingInput extends SectionSelectionInput {
  /** Reference installation method (IEC 60364-5-52). Defaults to "C". */
  method?: InstallationMethod;
  /** Ambient air (or ground, for D1/D2) temperature (°C). Defaults to the method's reference temperature. */
  ambientTemperature?: number;
  /** Number of circuits bunched together (grouping). Defaults to 1. */
  groupedCircuits?: number;
  /** Additional factor applied to the table ampacity (e.g. soil resistivity). Defaults to 1. */
  deratingFactor?: number;
}

export interface CableSizingResult {
  /** Chosen conductor cross-section (mm²). */
  section: number;
  /** Table ampacity of the chosen section before correction (A). */
  tableAmpacity: number;
  /** Ampacity after all correction factors (A). */
  ampacity: number;
  dropPercent: number;
  /** What fixed the section: the ampacity, the protective device (In ≤ I'z, I2 ≤ 1.45·I'z) or the voltage drop. */
  governedBy: "ampacity" | "protection" | "voltageDrop";
  /** The protective device, when one was requested. */
  protection?: ProtectionResult;
  /** Correction factors; `extra` is the soil-resistivity (or other user) factor. */
  factors: { temperature: number; grouping: number; extra: number; total: number };
}

/**
 * Smallest section from `ratings` ([section, table ampacity]) whose corrected ampacity
 * (table · factors.total) carries the load, is protected by the requested device and whose
 * voltage drop is within the limit.
 */
function selectSection(
  input: SectionSelectionInput,
  ratings: readonly (readonly [number, number])[],
  factors: CableSizingResult["factors"],
  rules: ProtectionRules,
): CableSizingResult | null {
  assertPositive(input.maxDropPercent, "maxDropPercent");
  if (input.protection && smallestDevice(input.protection, input.current, rules) === null) {
    throw new Error("אין מבטח מהסוג שנבחר בזרם נקוב שמתאים לזרם העומס");
  }
  let firstByAmpacity: number | null = null;
  let firstProtected: number | null = null;
  for (const [section, tableAmpacity] of ratings) {
    const ampacity = tableAmpacity * factors.total;
    if (ampacity < input.current) continue;
    firstByAmpacity ??= section;
    const protection = input.protection ? selectProtection(input.protection, input.current, ampacity, rules) : undefined;
    if (protection === null) continue;
    firstProtected ??= section;
    const { percent } = voltageDrop({ ...input, section });
    if (percent <= input.maxDropPercent) {
      return {
        section,
        tableAmpacity,
        ampacity,
        dropPercent: percent,
        governedBy: section === firstByAmpacity ? "ampacity" : section === firstProtected ? "protection" : "voltageDrop",
        ...(protection ? { protection } : {}),
        factors,
      };
    }
  }
  return null;
}

/**
 * Cable sizing per IEC 60364-5-52: smallest standard copper section that satisfies both
 * the corrected ampacity of the chosen reference installation method and the voltage-drop
 * limit. Iz = Iz,table · k_temp · k_group · k_extra. Returns null if none fits.
 */
export function sizeCable(input: CableSizingInput): CableSizingResult | null {
  if ((input.material ?? "copper") !== "copper") {
    throw new Error("טבלאות IEC זמינות כרגע לנחושת בלבד");
  }
  const method = input.method ?? "C";
  const extra = input.deratingFactor ?? 1;
  assertPositive(extra, "deratingFactor");
  const temperature = temperatureFactor(method, input.ambientTemperature ?? referenceTemperature(method));
  const grouping = groupingFactor(input.groupedCircuits ?? 1);
  const table = AMPACITY_CU_PVC[method][input.phases === 3 ? 3 : 2];
  const ratings = STANDARD_SECTIONS_MM2.map((section) => [section, table[section]] as const);
  return selectSection(input, ratings, { temperature, grouping, extra, total: temperature * grouping * extra }, "iec");
}

export interface IsraeliCableSizingInput extends SectionSelectionInput {
  /** Installation method id from IL_INSTALLATION_METHODS (third schedule), e.g. "יב". */
  method: string;
  /** Insulation temperature rating: 70°C (PVC) or 90°C (XLPE). Defaults to 70. */
  insulation?: IlInsulation;
  /** Ambient air / ground temperature (°C). Defaults to 35°C in air, 30°C in ground. */
  ambientTemperature?: number;
  /** Grouping per tables 4–7. Omit for a single circuit. */
  grouping?: IlGroupingInput;
  /** Soil thermal resistivity (K·m/W), table 3; applies to method ל״א only. Defaults to 2.5. */
  soilResistivity?: number;
}

/**
 * Cable sizing per the Israeli Electricity Regulations (העמסה והגנה, התשע״ד–2014):
 * I'z = Iz · c, where Iz comes from the second-schedule table for the installation method
 * and c is the product of the first-schedule correction factors. Returns null if none fits.
 */
export function sizeCableIL(input: IsraeliCableSizingInput): CableSizingResult | null {
  const method = ilMethod(input.method);
  const insulation = input.insulation ?? 70;
  const temperature = ilTemperatureFactor(
    method.medium, insulation, input.ambientTemperature ?? ilReferenceTemperature(method.medium),
  );
  const grouping = input.grouping ? ilGroupingFactor(input.grouping) : 1;
  const extra = method.grouping === "buried-direct" ? ilSoilFactor(input.soilResistivity ?? 2.5) : 1;
  const ratings = ilRatings(insulation, method.table, input.material ?? "copper", input.phases === 3 ? 3 : 1);
  if (ratings.length === 0) {
    throw new Error(`בטבלה ${insulation}.${method.table} בתקנות אין ערכים תקינים לאלומיניום`);
  }
  // Voltage drop at the insulation's maximum conductor temperature unless given.
  const sizingInput = { conductorTemperature: insulation, ...input };
  return selectSection(sizingInput, ratings, { temperature, grouping, extra, total: temperature * grouping * extra }, "il");
}
