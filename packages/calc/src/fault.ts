import { assertPositive } from "./validate";

/**
 * Three-phase symmetrical short-circuit current at the secondary terminals of a
 * transformer, ignoring upstream impedance: Isc = S / (√3 · U · uk).
 * @param ratedPowerKva transformer rating (kVA)
 * @param voltage secondary line-to-line voltage (V)
 * @param impedancePercent short-circuit impedance uk (%)
 * @returns current in amperes
 */
export function transformerShortCircuit(ratedPowerKva: number, voltage: number, impedancePercent: number): number {
  assertPositive(ratedPowerKva, "ratedPowerKva");
  assertPositive(voltage, "voltage");
  assertPositive(impedancePercent, "impedancePercent");
  return (ratedPowerKva * 1000) / (Math.sqrt(3) * voltage * (impedancePercent / 100));
}

/** Earth-fault current in a TN system: Ia = U0 / Zs. */
export function faultLoopCurrent(phaseVoltage: number, loopImpedance: number): number {
  assertPositive(phaseVoltage, "phaseVoltage");
  assertPositive(loopImpedance, "loopImpedance");
  return phaseVoltage / loopImpedance;
}
