import type { YieldValidationError } from '@/screens/recipe-management/types/Recipe';

// Yield adjustment bounds
export const YIELD_MIN_MULTIPLIER = 0.5; // 50% of original
export const YIELD_MAX_MULTIPLIER = 10; // 10x original

// Rounding precision
export const QUANTITY_DECIMAL_PLACES = 2; // Round quantities to 2 decimals
export const MULTIPLIER_DECIMAL_PLACES = 4; // Round multipliers to 4 decimals

/**
 * Parse yield from recipe yield field
 * @param recipeYield - String or number from recipe
 * @returns Parsed numeric yield value (always > 0)
 */
export function parseYield(recipeYield: string | number | undefined): number {
    // Default to 1 serving if not provided
    if (!recipeYield) return 1;

    // If already a number, return it (ensure positive)
    if (typeof recipeYield === 'number') {
        return recipeYield > 0 ? recipeYield : 1;
    }

    // Handle ranges: "6-8 servings" → 7 (midpoint)
    const rangeMatch = recipeYield.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        return Math.round((min + max) / QUANTITY_DECIMAL_PLACES);
    }

    // Extract first number from string
    // Examples: "4 servings" → 4, "Makes 12" → 12
    const match = recipeYield.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }

    // Fallback to 1 serving
    return 1;
}

/**
 * Scale ingredient quantity by yield multiplier
 * @param quantity - Original quantity value
 * @param multiplier - Yield multiplier
 * @returns Scaled quantity rounded to 2 decimal places, or null if input is null/undefined
 */
export function scaleQuantity(
    quantity: number | null | undefined,
    multiplier: number
): number | null {
    if (quantity === null || quantity === undefined) {
        return null;
    }

    // Multiply and round to 2 decimal places
    return Math.round(quantity * multiplier * 100) / 100;
}

/**
 * Validate yield input value
 * @param value - User input value
 * @param originalYield - Original recipe yield
 * @returns Validation error or null if valid
 */
export function validateYield(
    value: number,
    originalYield: number
): YieldValidationError | null {
    const minYield = originalYield * YIELD_MIN_MULTIPLIER;
    const maxYield = originalYield * YIELD_MAX_MULTIPLIER;

    if (isNaN(value) || !isFinite(value)) {
        return {
            type: 'invalid_number',
            message: 'Please enter a valid number',
        };
    }

    if (value < minYield) {
        return {
            type: 'below_minimum',
            message: `Minimum yield is ${minYield.toFixed(1)} servings`,
            suggestedValue: minYield,
        };
    }

    if (value > maxYield) {
        return {
            type: 'above_maximum',
            message: `Maximum yield is ${maxYield.toFixed(0)} servings`,
            suggestedValue: maxYield,
        };
    }

    return null;
}

/**
 * Calculate yield multiplier for scaling
 * @param currentYield - Current yield value
 * @param originalYield - Original recipe yield
 * @returns Yield multiplier rounded to 4 decimal places
 */
export function calculateMultiplier(
    currentYield: number,
    originalYield: number
): number {
    if (originalYield === 0) {
        return 1.0; // Avoid division by zero
    }

    // Divide and round to 4 decimal places
    return Math.round((currentYield / originalYield) * 10000) / 10000;
}
