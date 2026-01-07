/**
 * Curated list of standard units for ingredients and shopping list items.
 * Used across the application for consistency.
 */
export const STANDARD_UNITS = [
    'stk',
    'g',
    'kg',
    'dl',
    'l',
    'ts',
    'ss',
    'pk',
    'boks',
    'pose',
    'bunt',
    'flaske',
] as const;

export type StandardUnit = typeof STANDARD_UNITS[number];

/**
 * Default unit for new items.
 */
export const DEFAULT_UNIT: StandardUnit = 'stk';

/**
 * Check if a unit is in the standard list.
 */
export function isStandardUnit(unit: string): unit is StandardUnit {
    return STANDARD_UNITS.includes(unit as StandardUnit);
}
