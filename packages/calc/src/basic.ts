import { assertPositive, assertFinite } from "./validate";

/** Ohm's law: solve for the missing quantity given any two of V, I, R. */
export function ohmsLaw(input: { voltage?: number; current?: number; resistance?: number }) {
  const { voltage: v, current: i, resistance: r } = input;
  const given = [v, i, r].filter((x) => x !== undefined).length;
  if (given !== 2) throw new Error("Provide exactly two of voltage, current, resistance");
  if (v === undefined) return { voltage: i! * r!, current: i!, resistance: r! };
  if (i === undefined) {
    assertPositive(r!, "resistance");
    return { voltage: v, current: v / r!, resistance: r! };
  }
  assertPositive(i, "current");
  return { voltage: v, current: i, resistance: v / i };
}

export type Phases = 1 | 3;

/**
 * Active, apparent and reactive power for a balanced load.
 * For three-phase, `voltage` is the line-to-line voltage.
 */
export function power(input: { voltage: number; current: number; powerFactor?: number; phases: Phases }) {
  const { voltage, current, phases } = input;
  const pf = input.powerFactor ?? 1;
  assertFinite(voltage, "voltage");
  assertFinite(current, "current");
  if (pf < 0 || pf > 1) throw new Error("powerFactor must be between 0 and 1");
  const k = phases === 3 ? Math.sqrt(3) : 1;
  const apparent = k * voltage * current;
  const active = apparent * pf;
  const reactive = apparent * Math.sqrt(1 - pf * pf);
  return { active, apparent, reactive };
}

/** Load current from active power. For three-phase, `voltage` is line-to-line. */
export function currentFromPower(input: { activePower: number; voltage: number; powerFactor?: number; phases: Phases }) {
  const pf = input.powerFactor ?? 1;
  assertPositive(input.voltage, "voltage");
  assertPositive(pf, "powerFactor");
  const k = input.phases === 3 ? Math.sqrt(3) : 1;
  return input.activePower / (k * input.voltage * pf);
}
