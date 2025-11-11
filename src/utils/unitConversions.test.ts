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
    it('should convert ounces to grams', () => {
      const result = convertToMetric('1', 'oz');
      expect(result.metricQuantity).toBe('28');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert pounds to grams', () => {
      const result = convertToMetric('1', 'lb');
      expect(result.metricQuantity).toBe('454');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle plural forms', () => {
      expect(convertToMetric('2', 'ounces').metricQuantity).toBe('57');
      expect(convertToMetric('2', 'pounds').metricQuantity).toBe('907');
    });

    it('should handle abbreviated forms', () => {
      expect(convertToMetric('1', 'oz').metricQuantity).toBe('28');
      expect(convertToMetric('1', 'lbs').metricQuantity).toBe('454');
    });
  });

  describe('convertToMetric - Volume Conversions (Liquids)', () => {
    it('should convert cups to milliliters', () => {
      const result = convertToMetric('1', 'cup');
      expect(result.metricQuantity).toBe('237');
      expect(result.metricUnit).toBe('ml');
    });

    it('should convert tablespoons to milliliters', () => {
      const result = convertToMetric('1', 'tbsp');
      expect(result.metricQuantity).toBe('15');
      expect(result.metricUnit).toBe('ml');
    });

    it('should convert teaspoons to milliliters', () => {
      const result = convertToMetric('1', 'tsp');
      expect(result.metricQuantity).toBe('5');
      expect(result.metricUnit).toBe('ml');
    });

    it('should convert fluid ounces to milliliters', () => {
      const result = convertToMetric('1', 'fl oz');
      expect(result.metricQuantity).toBe('30');
      expect(result.metricUnit).toBe('ml');
    });
  });

  describe('convertToMetric - Density-Based Conversions', () => {
    it('should convert cups of flour to grams', () => {
      const result = convertToMetric('1', 'cup', 'flour');
      expect(result.metricQuantity).toBe('120');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert cups of all-purpose flour to grams', () => {
      const result = convertToMetric('2', 'cups', 'all-purpose flour');
      expect(result.metricQuantity).toBe('240');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert cups of bread flour to grams', () => {
      const result = convertToMetric('1', 'cup', 'bread flour');
      expect(result.metricQuantity).toBe('127');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert cups of sugar to grams', () => {
      const result = convertToMetric('1', 'cup', 'sugar');
      expect(result.metricQuantity).toBe('200');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert cups of brown sugar to grams', () => {
      const result = convertToMetric('1', 'cup', 'brown sugar');
      expect(result.metricQuantity).toBe('220');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert cups of butter to grams', () => {
      const result = convertToMetric('1', 'cup', 'butter');
      expect(result.metricQuantity).toBe('227');
      expect(result.metricUnit).toBe('g');
    });

    it('should convert tablespoons of butter to grams', () => {
      const result = convertToMetric('1', 'tbsp', 'butter');
      expect(result.metricQuantity).toBe('14');
      expect(result.metricUnit).toBe('g');
    });

    it('should fall back to volume for unknown ingredients', () => {
      const result = convertToMetric('1', 'cup', 'unknown ingredient');
      expect(result.metricQuantity).toBe('237');
      expect(result.metricUnit).toBe('ml');
    });
  });

  describe('convertToMetric - Fraction Support', () => {
    it('should handle simple fractions', () => {
      const result = convertToMetric('1/2', 'cup', 'flour');
      expect(result.metricQuantity).toBe('60');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle quarter fractions', () => {
      const result = convertToMetric('1/4', 'cup', 'sugar');
      expect(result.metricQuantity).toBe('50');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle third fractions', () => {
      const result = convertToMetric('1/3', 'cup');
      expect(result.metricQuantity).toBe('79');
      expect(result.metricUnit).toBe('ml');
    });
  });

  describe('convertToMetric - Range Support', () => {
    it('should handle ranges by taking midpoint', () => {
      const result = convertToMetric('2-3', 'cups', 'flour');
      // Midpoint is 2.5, 2.5 * 120 = 300
      expect(result.metricQuantity).toBe('300');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle ranges for weight units', () => {
      const result = convertToMetric('1-2', 'lb');
      // Midpoint is 1.5, 1.5 * 453.592 = 680.388 ≈ 680
      expect(result.metricQuantity).toBe('680');
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

    it('should handle whitespace', () => {
      const result = convertToMetric(' 2 ', ' cups ', 'flour');
      expect(result.metricQuantity).toBe('240');
      expect(result.metricUnit).toBe('g');
    });

    it('should be case-insensitive', () => {
      expect(convertToMetric('1', 'CUP', 'FLOUR').metricQuantity).toBe('120');
      expect(convertToMetric('1', 'Cup', 'Flour').metricQuantity).toBe('120');
    });
  });

  describe('convertToMetric - Multiple Quantities', () => {
    it('should handle decimal quantities', () => {
      const result = convertToMetric('1.5', 'cups', 'flour');
      expect(result.metricQuantity).toBe('180');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle large quantities', () => {
      const result = convertToMetric('10', 'cups', 'sugar');
      expect(result.metricQuantity).toBe('2000');
      expect(result.metricUnit).toBe('g');
    });

    it('should handle small quantities', () => {
      const result = convertToMetric('0.25', 'tsp');
      expect(result.metricQuantity).toBe('1');
      expect(result.metricUnit).toBe('ml');
    });
  });
});
