import { describe, it, expect } from 'vitest';
import ActivityTime from '../ActivityTime';

describe('ActivityTime enum', () => {
  it('should have all expected enum values defined', () => {
    expect(ActivityTime.ANYTIME).toBe(-1);
    expect(ActivityTime.MORNING).toBe(0);
    expect(ActivityTime.AFTERNOON).toBe(1);
    expect(ActivityTime.EVENING).toBe(2);
  });

  it('should have correct number of enum values', () => {
    const enumValues = Object.values(ActivityTime);
    const numericValues = enumValues.filter(value => typeof value === 'number');
    expect(numericValues).toHaveLength(4);
  });

  it('should have unique values for each enum member', () => {
    const values = [
      ActivityTime.ANYTIME,
      ActivityTime.MORNING,
      ActivityTime.AFTERNOON,
      ActivityTime.EVENING
    ];
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('should have correct enum keys', () => {
    const enumKeys = Object.keys(ActivityTime).filter(key => isNaN(Number(key)));
    expect(enumKeys).toContain('ANYTIME');
    expect(enumKeys).toContain('MORNING');
    expect(enumKeys).toContain('AFTERNOON');
    expect(enumKeys).toContain('EVENING');
    expect(enumKeys).toHaveLength(4);
  });

  it('should allow reverse lookup from value to key', () => {
    expect(ActivityTime[-1]).toBe('ANYTIME');
    expect(ActivityTime[0]).toBe('MORNING');
    expect(ActivityTime[1]).toBe('AFTERNOON');
    expect(ActivityTime[2]).toBe('EVENING');
  });

  it('should be a valid TypeScript enum', () => {
    // Test that enum can be used in type annotations and comparisons
    const testTime: ActivityTime = ActivityTime.MORNING;
    expect(testTime).toBe(ActivityTime.MORNING);
    expect(testTime === ActivityTime.MORNING).toBe(true);
    expect(testTime !== ActivityTime.EVENING).toBe(true);
  });

  it('should represent logical time progression', () => {
    // Test that time values are in logical order (excluding ANYTIME)
    expect(ActivityTime.MORNING).toBeLessThan(ActivityTime.AFTERNOON);
    expect(ActivityTime.AFTERNOON).toBeLessThan(ActivityTime.EVENING);
    expect(ActivityTime.ANYTIME).toBe(-1); // Special case for "any time"
  });
});