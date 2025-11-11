/**
 * Unit conversion utilities using convert.js library
 * Handles imperial ↔ metric conversions for recipe ingredients
 *
 * @module unitConversions
 */

import convert from 'convert';

/**
 * Ingredient density table for volume-to-weight conversions
 * Based on standard baking references and USDA data
 *
 * Values are grams per cup (and grams per tablespoon where applicable)
 */
const INGREDIENT_DENSITIES: Record<string, { cupsToGrams: number; tbspToGrams?: number }> = {
  // Flours
  'flour': { cupsToGrams: 120, tbspToGrams: 8 },
  'all-purpose flour': { cupsToGrams: 120, tbspToGrams: 8 },
  'ap flour': { cupsToGrams: 120, tbspToGrams: 8 },
  'bread flour': { cupsToGrams: 127, tbspToGrams: 8 },
  'whole wheat flour': { cupsToGrams: 120, tbspToGrams: 8 },
  'cake flour': { cupsToGrams: 115, tbspToGrams: 7 },

  // Sugars
  'sugar': { cupsToGrams: 200, tbspToGrams: 12.5 },
  'granulated sugar': { cupsToGrams: 200, tbspToGrams: 12.5 },
  'white sugar': { cupsToGrams: 200, tbspToGrams: 12.5 },
  'brown sugar': { cupsToGrams: 220, tbspToGrams: 14 },
  'packed brown sugar': { cupsToGrams: 220, tbspToGrams: 14 },
  'powdered sugar': { cupsToGrams: 120, tbspToGrams: 8 },
  'confectioners sugar': { cupsToGrams: 120, tbspToGrams: 8 },
  'icing sugar': { cupsToGrams: 120, tbspToGrams: 8 },

  // Fats
  'butter': { cupsToGrams: 227, tbspToGrams: 14 },
  'margarine': { cupsToGrams: 227, tbspToGrams: 14 },
  'shortening': { cupsToGrams: 192, tbspToGrams: 12 },
  'oil': { cupsToGrams: 224, tbspToGrams: 14 },
  'olive oil': { cupsToGrams: 224, tbspToGrams: 14 },
  'vegetable oil': { cupsToGrams: 224, tbspToGrams: 14 },

  // Other common ingredients
  'cocoa powder': { cupsToGrams: 120, tbspToGrams: 8 },
  'honey': { cupsToGrams: 340, tbspToGrams: 21 },
  'maple syrup': { cupsToGrams: 312, tbspToGrams: 20 },
  'molasses': { cupsToGrams: 337, tbspToGrams: 21 },

  // Liquids (using ml → g at 1:1 ratio for water-based)
  'milk': { cupsToGrams: 237, tbspToGrams: 15 },
  'water': { cupsToGrams: 237, tbspToGrams: 15 },
  'cream': { cupsToGrams: 240, tbspToGrams: 15 },
  'yogurt': { cupsToGrams: 245, tbspToGrams: 15 },
};

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
  'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
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
  'oz', 'ounce', 'ounces',
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
function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  return unit.toLowerCase().trim();
}

/**
 * Check if a unit is metric
 */
export function isMetricUnit(unit: string | null): boolean {
  if (!unit) return false;
  return METRIC_UNITS.has(normalizeUnit(unit) || '');
}

/**
 * Check if a unit can be converted
 */
export function isConvertibleUnit(unit: string | null): boolean {
  if (!unit) return false;
  const normalized = normalizeUnit(unit);
  if (!normalized) return false;

  return !NON_CONVERTIBLE_UNITS.has(normalized) &&
         (IMPERIAL_VOLUME_UNITS.has(normalized) ||
          IMPERIAL_WEIGHT_UNITS.has(normalized) ||
          METRIC_UNITS.has(normalized));
}

/**
 * Get density factor for an ingredient (grams per cup or per tablespoon)
 */
function getDensity(ingredientName: string, unit: string): number | null {
  const normalized = ingredientName.toLowerCase().trim();
  const density = INGREDIENT_DENSITIES[normalized];

  if (!density) return null;

  // Check if asking for tablespoon conversion
  const unitNorm = normalizeUnit(unit);
  if (unitNorm === 'tbsp' || unitNorm === 'tablespoon' || unitNorm === 'tablespoons' || unitNorm === 'T') {
    return density.tbspToGrams || null;
  }

  return density.cupsToGrams;
}

/**
 * Convert imperial units to metric
 *
 * @param quantity - Amount (can be string with fractions/ranges)
 * @param unit - Unit of measurement
 * @param ingredientName - Name of ingredient (for density-based conversions)
 * @returns Metric quantity and unit, or null if not convertible
 *
 * @example
 * convertToMetric("2", "cups", "flour")
 * // { metricQuantity: "240", metricUnit: "g" }
 *
 * convertToMetric("1", "lb", "butter")
 * // { metricQuantity: "454", metricUnit: "g" }
 *
 * convertToMetric("1", "cup", "milk")
 * // { metricQuantity: "237", metricUnit: "ml" }
 */
export function convertToMetric(
  quantity: string | null,
  unit: string | null,
  ingredientName?: string
): ConversionResult {
  // Handle null/empty inputs
  if (!quantity || !unit) {
    return { metricQuantity: null, metricUnit: null };
  }

  const normalizedUnit = normalizeUnit(unit);
  if (!normalizedUnit) {
    return { metricQuantity: null, metricUnit: null };
  }

  // Already metric - return as-is
  if (isMetricUnit(normalizedUnit)) {
    return { metricQuantity: quantity, metricUnit: normalizedUnit };
  }

  // Non-convertible unit
  if (NON_CONVERTIBLE_UNITS.has(normalizedUnit)) {
    return { metricQuantity: null, metricUnit: null };
  }

  // Parse quantity
  const numericQuantity = parseQuantity(quantity);
  if (numericQuantity === null) {
    return { metricQuantity: null, metricUnit: null };
  }

  // Weight conversions (oz, lb → g)
  if (IMPERIAL_WEIGHT_UNITS.has(normalizedUnit)) {
    try {
      let grams: number;

      if (normalizedUnit === 'oz' || normalizedUnit === 'ounce' || normalizedUnit === 'ounces') {
        grams = convert(numericQuantity, 'oz').to('g');
      } else if (normalizedUnit === 'lb' || normalizedUnit === 'pound' || normalizedUnit === 'pounds' || normalizedUnit === 'lbs') {
        grams = convert(numericQuantity, 'lb').to('g');
      } else {
        return { metricQuantity: null, metricUnit: null };
      }

      return {
        metricQuantity: Math.round(grams).toString(),
        metricUnit: 'g',
      };
    } catch {
      return { metricQuantity: null, metricUnit: null };
    }
  }

  // Volume conversions
  if (IMPERIAL_VOLUME_UNITS.has(normalizedUnit)) {
    // Try density-based conversion first (volume → weight for solids)
    if (ingredientName) {
      const density = getDensity(ingredientName, normalizedUnit);
      if (density) {
        const grams = Math.round(numericQuantity * density);
        return {
          metricQuantity: grams.toString(),
          metricUnit: 'g',
        };
      }
    }

    // Fall back to volume conversion (volume → ml for liquids)
    try {
      let ml: number;

      if (normalizedUnit === 'cup' || normalizedUnit === 'cups' || normalizedUnit === 'c') {
        ml = convert(numericQuantity, 'cup').to('ml');
      } else if (normalizedUnit === 'tbsp' || normalizedUnit === 'tablespoon' || normalizedUnit === 'tablespoons' || normalizedUnit === 'T') {
        ml = convert(numericQuantity, 'tablespoon').to('ml');
      } else if (normalizedUnit === 'tsp' || normalizedUnit === 'teaspoon' || normalizedUnit === 'teaspoons' || normalizedUnit === 't') {
        ml = convert(numericQuantity, 'teaspoon').to('ml');
      } else if (normalizedUnit === 'fl oz' || normalizedUnit.includes('fluid')) {
        ml = convert(numericQuantity, 'fl oz').to('ml');
      } else if (normalizedUnit === 'pint' || normalizedUnit === 'pints' || normalizedUnit === 'pt') {
        ml = convert(numericQuantity, 'pint').to('ml');
      } else if (normalizedUnit === 'quart' || normalizedUnit === 'quarts' || normalizedUnit === 'qt') {
        ml = convert(numericQuantity, 'quart').to('ml');
      } else if (normalizedUnit === 'gallon' || normalizedUnit === 'gallons' || normalizedUnit === 'gal') {
        ml = convert(numericQuantity, 'gallon').to('ml');
      } else {
        return { metricQuantity: null, metricUnit: null };
      }

      return {
        metricQuantity: Math.round(ml).toString(),
        metricUnit: 'ml',
      };
    } catch {
      return { metricQuantity: null, metricUnit: null };
    }
  }

  // Unknown unit
  return { metricQuantity: null, metricUnit: null };
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
