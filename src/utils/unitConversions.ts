/**
 * Unit conversion utilities using convert.js library
 * Handles imperial ↔ metric conversions for recipe ingredients
 *
 * @module unitConversions
 */

import convert from 'convert';

/**
 * Units that cannot be converted (unusual/non-standard measurements)
 */
const NON_CONVERTIBLE_UNITS = new Set([
    'pinch', 'dash', 'knob', 'sprig', 'bunch', 'clove', 'cloves',
    'head', 'stalk', 'leaf', 'leaves', 'slice', 'slices',
    'piece', 'pieces', 'whole', 'can', 'cans', 'package', 'packages',
]);

/**
 * Metric units (no conversion needed)
 */
const METRIC_UNITS = new Set([
    'each', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
]);

/**
 * Imperial volume units
 */
const IMPERIAL_VOLUME_UNITS = new Set([
    'cup', 'cups', 'c',
    'tbsp', 'tablespoon', 'tablespoons', 'T',
    'tsp', 'teaspoon', 'teaspoons', 't',
    'fl oz', 'fluid ounce', 'fluid ounces',
    'pint', 'pints', 'pt',
    'quart', 'quarts', 'qt',
    'gallon', 'gallons', 'gal',
]);

/**
 * Imperial weight units
 */
const IMPERIAL_WEIGHT_UNITS = new Set([
    'each', 'oz', 'ounce', 'ounces',
    'lb', 'pound', 'pounds', 'lbs',
]);

/**
 * Result of a unit conversion
 */
export interface ConversionResult {
    metricQuantity: string | null;
    metricUnit: string | null;
}

/**
 * Parse a quantity string to a number, handling fractions and ranges
 *
 * @param quantityStr - Quantity string (e.g., "2", "1/2", "2-3")
 * @returns Numeric value or null if unparseable
 *
 * @example
 * parseQuantity("2") // 2
 * parseQuantity("1/2") // 0.5
 * parseQuantity("2-3") // 2.5 (midpoint)
 */
function parseQuantity(quantityStr: string | null): number | null {
    if (!quantityStr || quantityStr.trim() === '') return null;

    const trimmed = quantityStr.trim();

    // Handle fractions (e.g., "1/2")
    if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0]);
            const denominator = parseFloat(parts[1]);
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return numerator / denominator;
            }
        }
    }

    // Handle ranges (e.g., "2-3") - return midpoint
    if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts.length === 2) {
            const start = parseFloat(parts[0]);
            const end = parseFloat(parts[1]);
            if (!isNaN(start) && !isNaN(end)) {
                return (start + end) / 2;
            }
        }
    }

    // Handle simple numbers
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
}

/**
 * Normalize unit string to lowercase and handle common variations
 */
function normalizeUnit(unit: string | null): string {
    if (!unit) return "each";
    return unit.toLowerCase().trim();
}

/**
 * Check if a unit is metric
 */
export function isMetricUnit(unit: string | null): boolean {
    if (!unit) return false;
    return METRIC_UNITS.has(normalizeUnit(unit) || 'each');
}

/**
 * Check if a unit can be converted
 */
export function isConvertibleUnit(unit: string | null): boolean {
    const normalized = normalizeUnit(unit);

    return !NON_CONVERTIBLE_UNITS.has(normalized) &&
        (IMPERIAL_VOLUME_UNITS.has(normalized) ||
            IMPERIAL_WEIGHT_UNITS.has(normalized) ||
            METRIC_UNITS.has(normalized));
}

/**
 * Convert imperial units to metric
 *
 * Note: Volume units (cups, tsp, tbsp) are NOT converted - ratios are preserved.
 * Only weight units (oz, lb) are converted to grams with smart rounding.
 *
 * @param quantity - Amount (can be string with fractions/ranges)
 * @param unit - Unit of measurement
 * @returns Metric quantity and unit, or null if not convertible
 *
 * @example
 * convertToMetric("2", "cups")
 * // { metricQuantity: null, metricUnit: null } - volume units not converted
 *
 * convertToMetric("1", "lb")
 * // { metricQuantity: "450", metricUnit: "g" } - weight with smart rounding
 *
 * convertToMetric("250", "ml")
 * // { metricQuantity: "250", metricUnit: "ml" } - already metric, copied for consistency
 */
export function convertToMetric(
    quantity: string | null,
    unit: string | null
): ConversionResult {
    // Handle null/empty inputs
    if (!quantity || !unit) {
        return {metricQuantity: null, metricUnit: null};
    }

    const normalizedUnit = normalizeUnit(unit);

    // Already metric - copy to metric fields for consistency
    if (isMetricUnit(normalizedUnit)) {
        return {metricQuantity: quantity, metricUnit: normalizedUnit};
    }

    // Volume units - keep as-is (ratios matter more than exact metric equivalents)
    // Don't convert cups, tsp, tbsp, fl oz, pints, quarts, gallons
    if (IMPERIAL_VOLUME_UNITS.has(normalizedUnit)) {
        return {metricQuantity: null, metricUnit: null};
    }

    // Non-convertible unit
    if (NON_CONVERTIBLE_UNITS.has(normalizedUnit)) {
        return {metricQuantity: null, metricUnit: null};
    }

    // Parse quantity
    const numericQuantity = parseQuantity(quantity);
    if (numericQuantity === null) {
        return {metricQuantity: null, metricUnit: null};
    }

    // Weight conversions (oz, lb → g) with smart rounding
    if (IMPERIAL_WEIGHT_UNITS.has(normalizedUnit)) {
        try {
            let grams: number;

            if (normalizedUnit === 'oz' || normalizedUnit === 'ounce' || normalizedUnit === 'ounces') {
                grams = convert(numericQuantity, 'oz').to('g');
            } else if (normalizedUnit === 'lb' || normalizedUnit === 'pound' || normalizedUnit === 'pounds' || normalizedUnit === 'lbs') {
                grams = convert(numericQuantity, 'lb').to('g');
            } else {
                return {metricQuantity: null, metricUnit: null};
            }

            // Apply smart rounding for practical measurements
            const rounded = smartRound(grams);

            return {
                metricQuantity: rounded.toString(),
                metricUnit: 'g',
            };
        } catch {
            return {metricQuantity: null, metricUnit: null};
        }
    }

    // Unknown unit (shouldn't reach here given checks above)
    return {metricQuantity: null, metricUnit: null};
}

/**
 * Smart rounding for practical measurements
 * Rounds to intuitive values based on magnitude
 *
 * @param value - Numeric value to round
 * @returns Rounded value
 *
 * @example
 * smartRound(227) // 225
 * smartRound(454) // 450
 * smartRound(1234) // 1200
 */
export function smartRound(value: number): number {
    if (value < 10) {
        // Round to nearest 1 for small values
        return Math.round(value);
    } else if (value < 50) {
        // Round to nearest 5
        return Math.round(value / 5) * 5;
    } else if (value < 100) {
        // Round to nearest 10
        return Math.round(value / 10) * 10;
    } else if (value < 500) {
        // Round to nearest 25
        return Math.round(value / 25) * 25;
    } else if (value < 1000) {
        // Round to nearest 50
        return Math.round(value / 50) * 50;
    } else {
        // Round to nearest 100 for large values
        return Math.round(value / 100) * 100;
    }
}

/**
 * Format quantity for display, handling fractions and ranges
 *
 * @param quantity - Numeric quantity
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string
 */
export function formatQuantity(quantity: number, decimals: number = 0): string {
    // Remove trailing zeros after decimal point, and the decimal point if no digits remain
    return quantity.toFixed(decimals).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0*$/, '');
}

/**
 * Check if a unit is a convertible weight unit
 * Weight units can be converted between imperial and metric (oz ↔ g, lb ↔ kg)
 *
 * @param unit - Unit to check
 * @returns True if it's a convertible weight unit
 */
export function isConvertibleWeightUnit(unit: string | null): boolean {
    const normalized = normalizeUnit(unit);
    return IMPERIAL_WEIGHT_UNITS.has(normalized) || METRIC_UNITS.has(normalized);
}

/**
 * Get the metric equivalent of an imperial weight unit
 *
 * @param unit - Imperial unit (oz, lb)
 * @returns Metric equivalent (g, kg)
 */
export function getMetricWeightUnit(unit: string): string {
    const normalized = normalizeUnit(unit);
    if (!normalized) return unit;

    if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') {
        return 'g';
    }
    if (normalized === 'lb' || normalized === 'pound' || normalized === 'pounds' || normalized === 'lbs') {
        return 'kg';
    }
    return unit; // Already metric or unknown
}

/**
 * Get the imperial equivalent of a metric weight unit
 *
 * @param unit - Metric unit (g, kg)
 * @returns Imperial equivalent (oz, lb)
 */
export function getImperialWeightUnit(unit: string): string {
    const normalized = normalizeUnit(unit);
    if (!normalized) return unit;

    if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') {
        return 'oz';
    }
    if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') {
        return 'lb';
    }
    return unit; // Already imperial or unknown
}
