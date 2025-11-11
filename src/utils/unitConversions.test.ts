/**
 * Unit tests for unit conversion utilities
 */

import { describe, it, expect } from 'vitest';
import {
  convertToMetric,
  isMetricUnit,
  isConvertibleUnit,
  formatQuantity,
} from './unitConversions';

describe('unitConversions', () => {
  describe('isMetricUnit', () => {
    it('should recognize metric weight units', () => {
      expect(isMetricUnit('g')).toBe(true);
      expect(isMetricUnit('gram')).toBe(true);
      expect(isMetricUnit('grams')).toBe(true);
      expect(isMetricUnit('kg')).toBe(true);
      expect(isMetricUnit('kilogram')).toBe(true);
      expect(isMetricUnit('kilograms')).toBe(true);
    });

    it('should recognize metric volume units', () => {
      expect(isMetricUnit('ml')).toBe(true);
      expect(isMetricUnit('milliliter')).toBe(true);
      expect(isMetricUnit('milliliters')).toBe(true);
      expect(isMetricUnit('l')).toBe(true);
      expect(isMetricUnit('liter')).toBe(true);
      expect(isMetricUnit('liters')).toBe(true);
    });

    it('should not recognize imperial units as metric', () => {
      expect(isMetricUnit('cup')).toBe(false);
      expect(isMetricUnit('oz')).toBe(false);
      expect(isMetricUnit('lb')).toBe(false);
      expect(isMetricUnit('tbsp')).toBe(false);
    });

    it('should handle null and empty strings', () => {
      expect(isMetricUnit(null)).toBe(false);
      expect(isMetricUnit('')).toBe(false);
    });
  });

  describe('isConvertibleUnit', () => {
    it('should recognize convertible imperial units', () => {
      expect(isConvertibleUnit('cup')).toBe(true);
      expect(isConvertibleUnit('oz')).toBe(true);
      expect(isConvertibleUnit('lb')).toBe(true);
      expect(isConvertibleUnit('tbsp')).toBe(true);
      expect(isConvertibleUnit('tsp')).toBe(true);
    });

    it('should recognize convertible metric units', () => {
      expect(isConvertibleUnit('g')).toBe(true);
      expect(isConvertibleUnit('ml')).toBe(true);
    });

    it('should not recognize non-convertible units', () => {
      expect(isConvertibleUnit('pinch')).toBe(false);
      expect(isConvertibleUnit('dash')).toBe(false);
      expect(isConvertibleUnit('clove')).toBe(false);
      expect(isConvertibleUnit('bunch')).toBe(false);
    });

    it('should handle null and empty strings', () => {
      expect(isConvertibleUnit(null)).toBe(false);
      expect(isConvertibleUnit('')).toBe(false);
    });
  });

  describe('formatQuantity', () => {
    it('should format integers without decimals', () => {
      expect(formatQuantity(2, 0)).toBe('2');
      expect(formatQuantity(10, 0)).toBe('10');
    });

    it('should format decimals with specified precision', () => {
      expect(formatQuantity(2.5, 1)).toBe('2.5');
      expect(formatQuantity(2.75, 2)).toBe('2.75');
    });

    it('should strip trailing zeros', () => {
      expect(formatQuantity(2.0, 1)).toBe('2');
      expect(formatQuantity(2.50, 2)).toBe('2.5');
    });
  });

  describe('convertToMetric - Weight Conversions', () => {
    it('should convert ounces to grams with smart rounding', () => {
      const result = convertToMetric('1', 'oz');
      expect(result.metricQuantity).toBe('30'); // 28.35g → 30g (rounded to nearest 5)
      expect(result.metricUnit).toBe('g');
    });

    it('should convert pounds to grams with smart rounding', () => {
      const result = convertToMetric('1', 'lb');
      expect(result.metricQuantity).toBe('450'); // 453.59g → 450g (rounded to nearest 25)
      expect(result.metricUnit).toBe('g');
    });

    it('should handle plural forms with smart rounding', () => {
      expect(convertToMetric('2', 'ounces').metricQuantity).toBe('60'); // 56.7g → 60g (rounded to nearest 10)
      expect(convertToMetric('2', 'pounds').metricQuantity).toBe('900'); // 907.18g → 900g
    });

    it('should handle abbreviated forms with smart rounding', () => {
      expect(convertToMetric('1', 'oz').metricQuantity).toBe('30');
      expect(convertToMetric('1', 'lbs').metricQuantity).toBe('450');
    });
  });

  describe('convertToMetric - Volume Units Preserved', () => {
    it('should NOT convert cups (keep ratios)', () => {
      const result = convertToMetric('1', 'cup');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should NOT convert tablespoons (keep ratios)', () => {
      const result = convertToMetric('1', 'tbsp');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should NOT convert teaspoons (keep ratios)', () => {
      const result = convertToMetric('1', 'tsp');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should NOT convert fluid ounces (keep ratios)', () => {
      const result = convertToMetric('1', 'fl oz');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });
  });

  describe('convertToMetric - Volume Units with Ingredient Names', () => {
    it('should NOT convert cups even with ingredient name (keep ratios)', () => {
      const result = convertToMetric('1', 'cup', 'flour');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should NOT convert cups of any ingredient', () => {
      expect(convertToMetric('2', 'cups', 'all-purpose flour').metricQuantity).toBeNull();
      expect(convertToMetric('1', 'cup', 'bread flour').metricQuantity).toBeNull();
      expect(convertToMetric('1', 'cup', 'sugar').metricQuantity).toBeNull();
      expect(convertToMetric('1', 'cup', 'brown sugar').metricQuantity).toBeNull();
      expect(convertToMetric('1', 'cup', 'butter').metricQuantity).toBeNull();
    });

    it('should NOT convert tablespoons even with ingredient name', () => {
      const result = convertToMetric('1', 'tbsp', 'butter');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should NOT convert any volume unit regardless of ingredient', () => {
      const result = convertToMetric('1', 'cup', 'unknown ingredient');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });
  });

  describe('convertToMetric - Fraction Support', () => {
    it('should handle fractions but NOT convert volume units', () => {
      const result = convertToMetric('1/2', 'cup', 'flour');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle fractions for weight units with smart rounding', () => {
      const result = convertToMetric('1/2', 'lb');
      expect(result.metricQuantity).toBe('225'); // 226.8g → 225g
      expect(result.metricUnit).toBe('g');
    });

    it('should parse fractions correctly for non-converted units', () => {
      const result = convertToMetric('1/4', 'cup');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });
  });

  describe('convertToMetric - Range Support', () => {
    it('should parse ranges but NOT convert volume units', () => {
      const result = convertToMetric('2-3', 'cups', 'flour');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle ranges for weight units with smart rounding', () => {
      const result = convertToMetric('1-2', 'lb');
      // Midpoint is 1.5, 1.5 * 453.592 = 680.388 → 700g (rounded to nearest 50)
      expect(result.metricQuantity).toBe('700');
      expect(result.metricUnit).toBe('g');
    });
  });

  describe('convertToMetric - Already Metric', () => {
    it('should return metric units unchanged', () => {
      expect(convertToMetric('100', 'g')).toEqual({
        metricQuantity: '100',
        metricUnit: 'g',
      });
    });

    it('should return ml unchanged', () => {
      expect(convertToMetric('500', 'ml')).toEqual({
        metricQuantity: '500',
        metricUnit: 'ml',
      });
    });

    it('should handle grams and kilograms', () => {
      expect(convertToMetric('2', 'kg')).toEqual({
        metricQuantity: '2',
        metricUnit: 'kg',
      });
    });
  });

  describe('convertToMetric - Non-Convertible Units', () => {
    it('should return null for pinch', () => {
      const result = convertToMetric('1', 'pinch');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should return null for dash', () => {
      const result = convertToMetric('1', 'dash');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should return null for clove', () => {
      const result = convertToMetric('2', 'cloves');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should return null for bunch', () => {
      const result = convertToMetric('1', 'bunch');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });
  });

  describe('convertToMetric - Edge Cases', () => {
    it('should handle null quantity', () => {
      const result = convertToMetric(null, 'cup');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle null unit', () => {
      const result = convertToMetric('1', null);
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle empty strings', () => {
      expect(convertToMetric('', 'cup')).toEqual({
        metricQuantity: null,
        metricUnit: null,
      });
      expect(convertToMetric('1', '')).toEqual({
        metricQuantity: null,
        metricUnit: null,
      });
    });

    it('should handle invalid quantities', () => {
      const result = convertToMetric('abc', 'cup');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle whitespace but NOT convert volume units', () => {
      const result = convertToMetric(' 2 ', ' cups ', 'flour');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should be case-insensitive (volume units not converted)', () => {
      expect(convertToMetric('1', 'CUP', 'FLOUR').metricQuantity).toBeNull();
      expect(convertToMetric('1', 'Cup', 'Flour').metricQuantity).toBeNull();
    });
  });

  describe('convertToMetric - Multiple Quantities', () => {
    it('should handle decimal quantities but NOT convert volume units', () => {
      const result = convertToMetric('1.5', 'cups', 'flour');
      expect(result.metricQuantity).toBeNull();
      expect(result.metricUnit).toBeNull();
    });

    it('should handle large weight quantities with smart rounding', () => {
      const result = convertToMetric('10', 'lb');
      expect(result.metricQuantity).toBe('4500'); // 4535.92g → 4500g
      expect(result.metricUnit).toBe('g');
    });

    it('should handle small weight quantities with smart rounding', () => {
      const result = convertToMetric('0.25', 'oz');
      expect(result.metricQuantity).toBe('7'); // 7.09g → 7g
      expect(result.metricUnit).toBe('g');
    });
  });
});
