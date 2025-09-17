import { describe, it, expect } from 'vitest';
import ActivityType from '../ActivityType';

describe('ActivityType enum', () => {
  it('should have all expected enum values defined', () => {
    expect(ActivityType.NONE).toBe(-1);
    expect(ActivityType.FOOD).toBe(0);
    expect(ActivityType.ACTIVITY).toBe(1);
    expect(ActivityType.MOVIE).toBe(2);
    expect(ActivityType.BIG).toBe(3);
  });

  it('should have correct number of enum values', () => {
    const enumValues = Object.values(ActivityType);
    const numericValues = enumValues.filter(value => typeof value === 'number');
    expect(numericValues).toHaveLength(5);
  });

  it('should have unique values for each enum member', () => {
    const values = [
      ActivityType.NONE,
      ActivityType.FOOD,
      ActivityType.ACTIVITY,
      ActivityType.MOVIE,
      ActivityType.BIG
    ];
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('should have correct enum keys', () => {
    const enumKeys = Object.keys(ActivityType).filter(key => isNaN(Number(key)));
    expect(enumKeys).toContain('NONE');
    expect(enumKeys).toContain('FOOD');
    expect(enumKeys).toContain('ACTIVITY');
    expect(enumKeys).toContain('MOVIE');
    expect(enumKeys).toContain('BIG');
    expect(enumKeys).toHaveLength(5);
  });

  it('should allow reverse lookup from value to key', () => {
    expect(ActivityType[-1]).toBe('NONE');
    expect(ActivityType[0]).toBe('FOOD');
    expect(ActivityType[1]).toBe('ACTIVITY');
    expect(ActivityType[2]).toBe('MOVIE');
    expect(ActivityType[3]).toBe('BIG');
  });

  it('should be a valid TypeScript enum', () => {
    // Test that enum can be used in type annotations and comparisons
    const testType: ActivityType = ActivityType.FOOD;
    expect(testType).toBe(ActivityType.FOOD);
    expect(testType === ActivityType.FOOD).toBe(true);
    expect(testType !== ActivityType.MOVIE).toBe(true);
  });
});