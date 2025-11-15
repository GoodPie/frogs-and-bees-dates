/**
 * Canonical Unit System
 *
 * This module defines the canonical unit system for recipe ingredients.
 * All units are normalized to their canonical form for consistent storage and processing.
 */

/**
 * Canonical unit types
 */
export type Unit =
    // Volume (Imperial)
    | 'cup'
    | 'tbsp'
    | 'tsp'
    // Weight (Imperial)
    | 'oz'
    | 'lb'
    // Volume (Metric)
    | 'ml'
    | 'l'
    // Weight (Metric)
    | 'g'
    | 'kg'
    // Non-convertible
    | 'pinch'
    | 'dash'
    | 'clove'
    | 'whole'
    | 'can'
    | 'package'
    | 'each'; // Default/fallback

/**
 * Canonical units grouped by category
 */
export const UNITS = {
    VOLUME_IMPERIAL: ['cup', 'tbsp', 'tsp'] as const,
    WEIGHT_IMPERIAL: ['oz', 'lb'] as const,
    VOLUME_METRIC: ['ml', 'l'] as const,
    WEIGHT_METRIC: ['g', 'kg'] as const,
    NON_CONVERTIBLE: ['pinch', 'dash', 'clove', 'whole', 'can', 'package', 'each'] as const,
} as const;

/**
 * All canonical units as a flat array
 */
export const CANONICAL_UNITS: readonly Unit[] = [
    ...UNITS.VOLUME_IMPERIAL,
    ...UNITS.WEIGHT_IMPERIAL,
    ...UNITS.VOLUME_METRIC,
    ...UNITS.WEIGHT_METRIC,
    ...UNITS.NON_CONVERTIBLE,
] as const;

/**
 * Display labels for units in the UI
 */
export const UNIT_DISPLAY_LABELS: Record<Unit, string> = {
    // Volume (Imperial)
    cup: 'cup',
    tbsp: 'tbsp',
    tsp: 'tsp',
    // Weight (Imperial)
    oz: 'oz',
    lb: 'lb',
    // Volume (Metric)
    ml: 'mL',
    l: 'L',
    // Weight (Metric)
    g: 'g',
    kg: 'kg',
    // Non-convertible
    pinch: 'pinch',
    dash: 'dash',
    clove: 'clove',
    whole: 'whole',
    can: 'can',
    package: 'package',
    each: 'each',
};

/**
 * Unit aliases - maps all variations to canonical forms
 */
export const UNIT_ALIASES: Record<string, Unit> = {
    // Volume (Imperial) - cups
    'cups': 'cup',
    'c': 'cup',

    // Volume (Imperial) - tablespoon
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'T': 'tbsp',
    'tbs': 'tbsp',

    // Volume (Imperial) - teaspoon
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    't': 'tsp',

    // Volume (Imperial) - fluid ounce
    'fl oz': 'oz',
    'fluid ounce': 'oz',
    'fluid ounces': 'oz',
    'floz': 'oz',

    // Volume (Imperial) - other volume units (normalize to ml)
    'pint': 'ml',
    'pints': 'ml',
    'pt': 'ml',
    'quart': 'ml',
    'quarts': 'ml',
    'qt': 'ml',
    'gallon': 'ml',
    'gallons': 'ml',
    'gal': 'ml',

    // Weight (Imperial) - ounce
    'ounce': 'oz',
    'ounces': 'oz',

    // Weight (Imperial) - pound
    'pound': 'lb',
    'pounds': 'lb',
    'lbs': 'lb',

    // Volume (Metric) - milliliter
    'milliliter': 'ml',
    'milliliters': 'ml',
    'mL': 'ml',
    'ML': 'ml',

    // Volume (Metric) - liter
    'liter': 'l',
    'liters': 'l',
    'L': 'l',

    // Weight (Metric) - gram
    'gram': 'g',
    'grams': 'g',
    'G': 'g',

    // Weight (Metric) - kilogram
    'kilogram': 'kg',
    'kilograms': 'kg',
    'kilo': 'kg',
    'kilos': 'kg',
    'Kg': 'kg',
    'KG': 'kg',

    // Non-convertible - cloves
    'cloves': 'clove',

    // Non-convertible - other plurals
    'dashes': 'dash',
    'pinches': 'pinch',
    'cans': 'can',
    'packages': 'package',
    'pkgs': 'package',
    'pkg': 'package',

    // Non-convertible - other variations
    'knob': 'whole',
    'knobs': 'whole',
    'sprig': 'whole',
    'sprigs': 'whole',
    'bunch': 'whole',
    'bunches': 'whole',
    'head': 'whole',
    'heads': 'whole',
    'stalk': 'whole',
    'stalks': 'whole',
    'leaf': 'whole',
    'leaves': 'whole',
    'slice': 'whole',
    'slices': 'whole',
    'piece': 'whole',
    'pieces': 'whole',
};

/**
 * Normalizes a unit string to its canonical form
 *
 * @param unit - The unit string to normalize (can be plural, abbreviation, or full name)
 * @returns The canonical unit form, or 'each' if unit is null/empty/unrecognized
 *
 * @example
 * normalizeUnit('cups') // returns 'cup'
 * normalizeUnit('tablespoon') // returns 'tbsp'
 * normalizeUnit('GRAMS') // returns 'g'
 * normalizeUnit(null) // returns 'each'
 */
export function normalizeUnit(unit: string | null | undefined): Unit {
    if (!unit) return 'each';

    const lowercased = unit.toLowerCase().trim();

    // Check if it's already canonical
    if (CANONICAL_UNITS.includes(lowercased as Unit)) {
        return lowercased as Unit;
    }

    // Check aliases
    if (lowercased in UNIT_ALIASES) {
        return UNIT_ALIASES[lowercased];
    }

    // Unrecognized unit - default to 'each'
    return 'each';
}

/**
 * Checks if a unit string is valid (either canonical or has a known alias)
 *
 * @param unit - The unit string to validate
 * @returns True if the unit is valid, false otherwise
 *
 * @example
 * isValidUnit('cup') // true
 * isValidUnit('cups') // true
 * isValidUnit('tablespoon') // true
 * isValidUnit('invalid') // false
 */
export function isValidUnit(unit: string | null | undefined): boolean {
    if (!unit) return false;

    const lowercased = unit.toLowerCase().trim();

    return (
        CANONICAL_UNITS.includes(lowercased as Unit) ||
        lowercased in UNIT_ALIASES
    );
}

/**
 * Gets the display label for a unit
 *
 * @param unit - The unit (canonical form)
 * @returns The display label for the UI
 *
 * @example
 * getUnitDisplayLabel('ml') // 'mL'
 * getUnitDisplayLabel('l') // 'L'
 */
export function getUnitDisplayLabel(unit: Unit): string {
    return UNIT_DISPLAY_LABELS[unit];
}
