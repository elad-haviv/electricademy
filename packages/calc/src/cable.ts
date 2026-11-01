import {
  AMPACITY_CU_PVC_METHOD_C,
  RESISTIVITY_20C,
  STANDARD_SECTIONS_MM2,
  TEMP_COEFFICIENT,
  type ConductorMaterial,
  type StandardSection,
} from "./constants";
import type { Phases } from "./basic";
import { assertPositive } from "./validate";

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

export interface CableSizingInput extends Omit<VoltageDropInput, "section"> {
  /** Maximum allowed voltage drop (%). */
  maxDropPercent: number;
  /** Factor applied to the table ampacity (ambient, grouping, etc.). Defaults to 1. */
  deratingFactor?: number;
}

export interface CableSizingResult {
  section: StandardSection;
  ampacity: number;
  dropPercent: number;
  governedBy: "ampacity" | "voltageDrop";
}

/**
 * Smallest standard copper section that satisfies both the (derated) ampacity of
 * reference method C and the voltage-drop limit. Returns null if none fits.
 */
export function sizeCable(input: CableSizingInput): CableSizingResult | null {
  if ((input.material ?? "copper") !== "copper") {
    throw new Error("Cable sizing table is currently available for copper only");
  }
  assertPositive(input.maxDropPercent, "maxDropPercent");
  const derating = input.deratingFactor ?? 1;
  assertPositive(derating, "deratingFactor");
  const loaded: 2 | 3 = input.phases === 3 ? 3 : 2;
  const table = AMPACITY_CU_PVC_METHOD_C[loaded];

  let ampacityOnly: StandardSection | null = null;
  for (const section of STANDARD_SECTIONS_MM2) {
    const ampacity = table[section] * derating;
    if (ampacity < input.current) continue;
    ampacityOnly ??= section;
    const { percent } = voltageDrop({ ...input, section });
    if (percent <= input.maxDropPercent) {
      return {
        section,
        ampacity,
        dropPercent: percent,
        governedBy: section === ampacityOnly ? "ampacity" : "voltageDrop",
      };
    }
  }
  return null;
}
