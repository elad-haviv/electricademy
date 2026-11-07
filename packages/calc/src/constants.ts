/** Conductor materials supported by the calculators. */
export type ConductorMaterial = "copper" | "aluminium";

/** Resistivity at 20°C in Ω·mm²/m. */
export const RESISTIVITY_20C: Record<ConductorMaterial, number> = {
  copper: 0.0175,
  aluminium: 0.0283,
};

/** Temperature coefficient of resistance (1/°C) near 20°C. */
export const TEMP_COEFFICIENT: Record<ConductorMaterial, number> = {
  copper: 0.00393,
  aluminium: 0.00403,
};

/** Standard conductor cross-sections in mm². */
export const STANDARD_SECTIONS_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
] as const;

export type StandardSection = (typeof STANDARD_SECTIONS_MM2)[number];
