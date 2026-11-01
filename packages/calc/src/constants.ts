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

/**
 * Reference current-carrying capacity (A) for copper, PVC-insulated (70°C) cables,
 * installation reference method C (clipped direct), ambient 30°C.
 * Source: IEC 60364-5-52 Table B.52.4 (educational reference values).
 * Real designs must apply correction factors and the applicable Israeli regulations.
 */
export const AMPACITY_CU_PVC_METHOD_C: Record<
  2 | 3,
  Record<StandardSection, number>
> = {
  2: {
    1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138,
    50: 168, 70: 213, 95: 258, 120: 299, 150: 344, 185: 392, 240: 461,
  },
  3: {
    1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119,
    50: 144, 70: 184, 95: 223, 120: 259, 150: 299, 185: 341, 240: 403,
  },
};
