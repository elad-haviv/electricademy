/**
 * Overload-protection coordination: Ib ≤ In ≤ I'z and I2 ≤ 1.45 · I'z.
 * Israeli Electricity Regulations (העמסה והגנה, 2014) regulation 6; IEC 60364-4-43 clause 433.1.
 */

export type ProtectiveDeviceType = "mcb" | "fuse" | "adjustable";
export type ProtectionRules = "il" | "iec";

/** Standard rated currents (A) of miniature circuit breakers. */
export const MCB_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125] as const;
/** Standard rated currents (A) of gG fuses (IEC 60269). */
export const FUSE_RATINGS = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630] as const;
/** Largest setting (A) assumed for adjustable circuit breakers. */
export const ADJUSTABLE_MAX = 1600;

export const DEVICE_LABELS: Record<ProtectiveDeviceType, string> = {
  mcb: "מא״ז (מפסק אוטומטי זעיר)",
  fuse: "נתיך gG",
  adjustable: "מפסק אוטומטי הניתן לכוונון",
};

/**
 * Conventional tripping/fusing current factor k, where I2 = k · In; null if the rules do not define it.
 * - Regulations: fuse 10 < In ≤ 25 → 1.75, In > 25 → 1.6; MCB 1.45; adjustable 1.3.
 * - IEC: gG fuse (IEC 60269-2) In ≤ 4 → 2.1, 4 < In < 16 → 1.9, In ≥ 16 → 1.6;
 *   MCB (IEC 60898-1) 1.45; adjustable (IEC 60947-2) 1.3.
 */
export function trippingFactor(type: ProtectiveDeviceType, ratedCurrent: number, rules: ProtectionRules): number | null {
  if (type === "mcb") return 1.45;
  if (type === "adjustable") return 1.3;
  if (rules === "il") {
    if (ratedCurrent > 25) return 1.6;
    if (ratedCurrent > 10) return 1.75;
    return null;
  }
  if (ratedCurrent >= 16) return 1.6;
  if (ratedCurrent > 4) return 1.9;
  return 2.1;
}

export interface ProtectionResult {
  type: ProtectiveDeviceType;
  /** Rated current or setting In (A). */
  ratedCurrent: number;
  /** Conventional tripping current I2 = k · In (A). */
  trippingCurrent: number;
  trippingFactor: number;
  /** 1.45 · I'z (A). */
  trippingLimit: number;
}

/** Smallest rated current (or 1 A-step setting) of the device type that is ≥ Ib and has a defined I2. */
export function smallestDevice(type: ProtectiveDeviceType, designCurrent: number, rules: ProtectionRules): number | null {
  if (type === "adjustable") {
    const setting = Math.max(1, Math.ceil(designCurrent));
    return setting <= ADJUSTABLE_MAX ? setting : null;
  }
  const series: readonly number[] = type === "mcb" ? MCB_RATINGS : FUSE_RATINGS;
  return series.find((r) => r >= designCurrent && trippingFactor(type, r, rules) !== null) ?? null;
}

/**
 * Chooses the smallest device with Ib ≤ In and checks In ≤ I'z and I2 ≤ 1.45·I'z.
 * Returns null if that device does not protect a conductor of ampacity `correctedAmpacity`
 * (a larger device never would, because In and I2 only grow).
 */
export function selectProtection(
  type: ProtectiveDeviceType, designCurrent: number, correctedAmpacity: number, rules: ProtectionRules,
): ProtectionResult | null {
  const ratedCurrent = smallestDevice(type, designCurrent, rules);
  if (ratedCurrent === null) return null;
  const k = trippingFactor(type, ratedCurrent, rules)!;
  const trippingLimit = 1.45 * correctedAmpacity;
  const trippingCurrent = k * ratedCurrent;
  // Small tolerance against floating-point noise in the products.
  if (ratedCurrent > correctedAmpacity + 1e-9 || trippingCurrent > trippingLimit + 1e-9) return null;
  return { type, ratedCurrent, trippingCurrent, trippingFactor: k, trippingLimit };
}
