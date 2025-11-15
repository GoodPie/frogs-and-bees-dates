import type { FractionDisplay, ScaledIngredient } from '@/screens/recipe-management/types/Recipe';

/**
 * Convert decimal to fraction display
 * @param value - Decimal value to convert
 * @returns Fraction display object
 */
export function decimalToFraction(value: number): FractionDisplay {
    // Extract whole number part
    const whole = Math.floor(value);
    const fractional = value - whole;

    // If very small fractional part, just return whole number
    if (fractional < 0.01) {
        return {
            whole,
            numerator: 0,
            denominator: 1,
            formatted: whole.toString()
        };
    }

    // Common cooking fractions with tolerance
    const fractions = [
        { decimal: 0.125, num: 1, denom: 8, tolerance: 0.02 },
        { decimal: 0.25, num: 1, denom: 4, tolerance: 0.02 },
        { decimal: 0.333, num: 1, denom: 3, tolerance: 0.02 },
        { decimal: 0.5, num: 1, denom: 2, tolerance: 0.02 },
        { decimal: 0.666, num: 2, denom: 3, tolerance: 0.02 },
        { decimal: 0.75, num: 3, denom: 4, tolerance: 0.02 },
    ];

    // Find matching fraction
    for (const frac of fractions) {
        if (Math.abs(fractional - frac.decimal) < frac.tolerance) {
            const formatted = whole > 0
                ? `${whole} ${frac.num}/${frac.denom}`
                : `${frac.num}/${frac.denom}`;

            return {
                whole,
                numerator: frac.num,
                denominator: frac.denom,
                formatted
            };
        }
    }

    // No match found - return decimal
    return {
        whole,
        numerator: 0,
        denominator: 1,
        formatted: value.toFixed(2)
    };
}

/**
 * Format scaled quantity for display
 * @param scaledIngredient - Scaled ingredient with quantity and unit
 * @returns Formatted string with quantity and unit
 */
export function formatScaledQuantity(scaledIngredient: ScaledIngredient): string {
    const { scaledQuantity, original } = scaledIngredient;

    // If no quantity, return just the ingredient name
    if (scaledQuantity === null) {
        return original.ingredientName;
    }

    // Convert to fraction for display
    const fraction = decimalToFraction(scaledQuantity);
    const quantityStr = fraction.formatted;

    // Combine with unit and name
    const unit = original.unit || '';
    return `${quantityStr}${unit ? ' ' + unit : ''} ${original.ingredientName}`.trim();
}
