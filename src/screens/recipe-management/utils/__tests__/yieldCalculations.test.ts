import { describe, it, expect } from 'vitest';
import {
    parseYield,
    scaleQuantity,
    validateYield,
    calculateMultiplier,
    YIELD_MIN_MULTIPLIER,
    YIELD_MAX_MULTIPLIER
} from '../yieldCalculations';

describe('parseYield', () => {
    it('should return number input as-is', () => {
        expect(parseYield(4)).toBe(4);
        expect(parseYield(8)).toBe(8);
        expect(parseYield(12)).toBe(12);
    });

    it('should extract number from string', () => {
        expect(parseYield("4 servings")).toBe(4);
        expect(parseYield("Makes 12")).toBe(12);
        expect(parseYield("Serves 6")).toBe(6);
    });

    it('should handle ranges by returning midpoint', () => {
        expect(parseYield("6-8 servings")).toBe(7);
        expect(parseYield("4-6")).toBe(5);
        expect(parseYield("2-4 people")).toBe(3);
    });

    it('should default to 1 for unparseable input', () => {
        expect(parseYield(undefined)).toBe(1);
        expect(parseYield("A few")).toBe(1);
        expect(parseYield("")).toBe(1);
    });

    it('should handle negative numbers by returning 1', () => {
        expect(parseYield(-5)).toBe(1);
    });

    it('should handle zero by returning 1', () => {
        expect(parseYield(0)).toBe(1);
    });
});

describe('scaleQuantity', () => {
    it('should scale quantity proportionally', () => {
        expect(scaleQuantity(2, 1.5)).toBe(3.0);
        expect(scaleQuantity(1, 1.5)).toBe(1.5);
        expect(scaleQuantity(4, 0.5)).toBe(2.0);
    });

    it('should return null for null input', () => {
        expect(scaleQuantity(null, 1.5)).toBeNull();
    });

    it('should return null for undefined input', () => {
        expect(scaleQuantity(undefined, 2)).toBeNull();
    });

    it('should round to 2 decimal places', () => {
        expect(scaleQuantity(2.345, 1.5)).toBe(3.52);
        expect(scaleQuantity(1.111, 1.5)).toBe(1.67);
    });

    it('should handle zero quantity', () => {
        expect(scaleQuantity(0, 1.5)).toBe(0);
    });

    it('should handle very small quantities', () => {
        expect(scaleQuantity(0.01, 0.5)).toBe(0.01);
    });
});

describe('validateYield', () => {
    it('should return null for valid yield', () => {
        expect(validateYield(6, 4)).toBeNull();
        expect(validateYield(2, 4)).toBeNull();
        expect(validateYield(4, 4)).toBeNull();
    });

    it('should return error for below minimum', () => {
        const error = validateYield(1, 4);
        expect(error).not.toBeNull();
        expect(error?.type).toBe('below_minimum');
        expect(error?.suggestedValue).toBe(2);
        expect(error?.message).toContain('Minimum yield');
    });

    it('should return error for above maximum', () => {
        const error = validateYield(50, 4);
        expect(error).not.toBeNull();
        expect(error?.type).toBe('above_maximum');
        expect(error?.suggestedValue).toBe(40);
        expect(error?.message).toContain('Maximum yield');
    });

    it('should return error for NaN', () => {
        const error = validateYield(NaN, 4);
        expect(error).not.toBeNull();
        expect(error?.type).toBe('invalid_number');
        expect(error?.message).toContain('valid number');
    });

    it('should return error for Infinity', () => {
        const error = validateYield(Infinity, 4);
        expect(error).not.toBeNull();
        expect(error?.type).toBe('invalid_number');
    });

    it('should return error for negative numbers', () => {
        const error = validateYield(-1, 4);
        expect(error).not.toBeNull();
        expect(error?.type).toBe('below_minimum');
    });

    it('should accept minimum boundary value', () => {
        expect(validateYield(2, 4)).toBeNull(); // 4 * 0.5 = 2
    });

    it('should accept maximum boundary value', () => {
        expect(validateYield(40, 4)).toBeNull(); // 4 * 10 = 40
    });
});

describe('calculateMultiplier', () => {
    it('should calculate normal multiplier', () => {
        expect(calculateMultiplier(6, 4)).toBe(1.5);
        expect(calculateMultiplier(8, 4)).toBe(2.0);
    });

    it('should calculate scale down multiplier', () => {
        expect(calculateMultiplier(2, 4)).toBe(0.5);
    });

    it('should return 1.0 for no change', () => {
        expect(calculateMultiplier(4, 4)).toBe(1.0);
    });

    it('should round to 4 decimal places', () => {
        expect(calculateMultiplier(10, 3)).toBe(3.3333);
        expect(calculateMultiplier(7, 3)).toBe(2.3333);
    });

    it('should handle zero originalYield by returning 1.0', () => {
        expect(calculateMultiplier(5, 0)).toBe(1.0);
    });
});

describe('constants', () => {
    it('should export correct minimum multiplier', () => {
        expect(YIELD_MIN_MULTIPLIER).toBe(0.5);
    });

    it('should export correct maximum multiplier', () => {
        expect(YIELD_MAX_MULTIPLIER).toBe(10);
    });
});
