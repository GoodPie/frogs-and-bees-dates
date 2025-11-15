import { describe, it, expect } from 'vitest';
import { decimalToFraction, formatScaledQuantity } from '../fractionFormatter';
import type { ScaledIngredient } from '@/screens/recipe-management/types/Recipe';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

describe('decimalToFraction', () => {
    it('should convert exact fractions', () => {
        expect(decimalToFraction(0.5).formatted).toBe('1/2');
        expect(decimalToFraction(0.75).formatted).toBe('3/4');
        expect(decimalToFraction(0.25).formatted).toBe('1/4');
        expect(decimalToFraction(0.333).formatted).toBe('1/3');
    });

    it('should convert close to fraction values', () => {
        expect(decimalToFraction(0.51).formatted).toBe('1/2');
        expect(decimalToFraction(0.49).formatted).toBe('1/2');
        expect(decimalToFraction(0.76).formatted).toBe('3/4');
        expect(decimalToFraction(0.74).formatted).toBe('3/4');
    });

    it('should convert mixed numbers', () => {
        expect(decimalToFraction(1.5).formatted).toBe('1 1/2');
        expect(decimalToFraction(2.25).formatted).toBe('2 1/4');
        expect(decimalToFraction(3.75).formatted).toBe('3 3/4');
    });

    it('should return whole numbers without fraction', () => {
        expect(decimalToFraction(2.0).formatted).toBe('2');
        expect(decimalToFraction(5).formatted).toBe('5');
        expect(decimalToFraction(10.001).formatted).toBe('10');
    });

    it('should return decimal for no match', () => {
        expect(decimalToFraction(0.37).formatted).toBe('0.37');
        expect(decimalToFraction(1.42).formatted).toBe('1.42');
    });

    it('should handle 1/8 fraction', () => {
        expect(decimalToFraction(0.125).formatted).toBe('1/8');
        expect(decimalToFraction(1.125).formatted).toBe('1 1/8');
    });

    it('should handle 2/3 fraction', () => {
        expect(decimalToFraction(0.666).formatted).toBe('2/3');
        expect(decimalToFraction(1.666).formatted).toBe('1 2/3');
    });

    it('should return correct fraction components', () => {
        const result = decimalToFraction(1.5);
        expect(result.whole).toBe(1);
        expect(result.numerator).toBe(1);
        expect(result.denominator).toBe(2);
        expect(result.formatted).toBe('1 1/2');
    });

    it('should handle fractional values less than 1', () => {
        const result = decimalToFraction(0.25);
        expect(result.whole).toBe(0);
        expect(result.numerator).toBe(1);
        expect(result.denominator).toBe(4);
        expect(result.formatted).toBe('1/4');
    });
});

describe('formatScaledQuantity', () => {
    it('should format quantity with unit', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'flour',
                quantity: 2,
                unit: 'cup'
            } as ParsedIngredient,
            scaledQuantity: 3,
            displayQuantity: '',
            wasScaled: true
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('3 cup flour');
    });

    it('should format fractional quantities', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'butter',
                quantity: 0.5,
                unit: 'cup'
            } as ParsedIngredient,
            scaledQuantity: 0.75,
            displayQuantity: '',
            wasScaled: true
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('3/4 cup butter');
    });

    it('should handle null scaledQuantity', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'salt to taste',
                quantity: null,
                unit: null
            } as ParsedIngredient,
            scaledQuantity: null,
            displayQuantity: '',
            wasScaled: false
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('salt to taste');
    });

    it('should handle missing unit', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'eggs',
                quantity: 2,
                unit: null
            } as ParsedIngredient,
            scaledQuantity: 3,
            displayQuantity: '',
            wasScaled: true
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('3 eggs');
    });

    it('should format mixed numbers correctly', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'sugar',
                quantity: 1,
                unit: 'cup'
            } as ParsedIngredient,
            scaledQuantity: 1.5,
            displayQuantity: '',
            wasScaled: true
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('1 1/2 cup sugar');
    });

    it('should handle empty unit string', () => {
        const scaledIngredient: ScaledIngredient = {
            original: {
                ingredientName: 'eggs',
                quantity: 2,
                unit: ''
            } as ParsedIngredient,
            scaledQuantity: 3,
            displayQuantity: '',
            wasScaled: true
        };

        expect(formatScaledQuantity(scaledIngredient)).toBe('3 eggs');
    });
});
