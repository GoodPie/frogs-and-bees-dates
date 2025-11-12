/**
 * Unit tests for ingredient batch parsing utilities
 * Tests batching logic, progress tracking, and cancellation support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chunk,
  parseIngredientsInBatches,
  validateIngredientBatch,
  calculateOptimalBatchSize,
  estimateParsingTime,
  createInitialProgress,
  needsBatchProcessing,
  formatProgressPercentage,
  formatTimeRemaining,
  type BatchParsingOptions,
} from './batchParser';
import {ParsedIngredient} from "../../../../models/ParsedIngredient";


describe('batchParser', () => {
  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5];
      const result = chunk(array, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle exact divisible chunks', () => {
      const array = [1, 2, 3, 4];
      const result = chunk(array, 2);
      expect(result).toEqual([[1, 2], [3, 4]]);
    });

    it('should handle single chunk when size >= array length', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 5);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle empty array', () => {
      const result = chunk([], 2);
      expect(result).toEqual([]);
    });

    it('should handle size of 1', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 1);
      expect(result).toEqual([[1], [2], [3]]);
    });
  });

  describe('parseIngredientsInBatches', () => {
    let mockParseFunction: ReturnType<typeof vi.fn>;
    let progressCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockParseFunction = vi.fn();
      progressCallback = vi.fn();
    });

    it('should parse ingredients in batches with progress tracking', async () => {
      const ingredients = Array.from({ length: 25 }, (_, i) => `ingredient ${i + 1}`);

      // Mock parse function to return parsed ingredients
      mockParseFunction.mockImplementation(async (batch: string[]) => {
        return batch.map((text) => ({
          originalText: text,
          ingredientName: text,
          quantity: null,
          unit: null,
          preparationNotes: null,
          metricQuantity: null,
          metricUnit: null,
          confidence: 1.0,
          parsingMethod: 'ai',
          requiresManualReview: false,
        })) as ParsedIngredient[];
      });

      const options: BatchParsingOptions = {
        onProgress: progressCallback,
        batchSize: 10,
      };

      const result = await parseIngredientsInBatches(ingredients, mockParseFunction, options);

      // Verify parsing completed
      expect(result.parsedIngredients).toHaveLength(25);
      expect(result.failedIngredients).toHaveLength(0);
      expect(result.totalBatches).toBe(3); // 25 ingredients / 10 per batch = 3 batches

      // Verify parse function called 3 times
      expect(mockParseFunction).toHaveBeenCalledTimes(3);

      // Verify progress callbacks fired
      expect(progressCallback).toHaveBeenCalledTimes(3);

      // Verify first progress callback
      const firstProgress = progressCallback.mock.calls[0][0];
      expect(firstProgress.currentBatch).toBe(1);
      expect(firstProgress.totalBatches).toBe(3);
      expect(firstProgress.totalCount).toBe(25);
    });

    it('should handle batch failures gracefully', async () => {
      const ingredients = ['ingredient 1', 'ingredient 2', 'ingredient 3'];

      // Mock parse function to fail on second batch
      mockParseFunction
        .mockResolvedValueOnce([
          {
            originalText: 'ingredient 1',
            ingredientName: 'ingredient 1',
            quantity: null,
            unit: null,
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 1.0,
            parsingMethod: 'ai',
            requiresManualReview: false,
          } as ParsedIngredient,
        ])
        .mockRejectedValueOnce(new Error('Parse error'));

      const options: BatchParsingOptions = {
        batchSize: 1,
      };

      const result = await parseIngredientsInBatches(ingredients, mockParseFunction, options);

      // First ingredient should succeed, second should fail, third should succeed
      expect(result.parsedIngredients.length).toBeGreaterThanOrEqual(1);
      expect(result.failedIngredients).toContain('ingredient 2');
    });

    it('should support cancellation via AbortSignal', async () => {
      const ingredients = Array.from({ length: 30 }, (_, i) => `ingredient ${i + 1}`);
      const abortController = new AbortController();

      mockParseFunction.mockImplementation(async () => {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [];
      });

      // Abort after first batch
      setTimeout(() => abortController.abort(), 15);

      const options: BatchParsingOptions = {
        signal: abortController.signal,
        batchSize: 10,
      };

      await expect(
        parseIngredientsInBatches(ingredients, mockParseFunction, options)
      ).rejects.toThrow('Ingredient parsing was cancelled');
    });

    it('should calculate estimated time remaining', async () => {
      const ingredients = Array.from({ length: 20 }, (_, i) => `ingredient ${i + 1}`);

      mockParseFunction.mockImplementation(async (batch: string[]) => {
        // Simulate 100ms per batch
        await new Promise((resolve) => setTimeout(resolve, 100));
        return batch.map((text) => ({
          originalText: text,
          ingredientName: text,
          quantity: null,
          unit: null,
          preparationNotes: null,
          metricQuantity: null,
          metricUnit: null,
          confidence: 1.0,
          parsingMethod: 'ai',
          requiresManualReview: false,
        })) as ParsedIngredient[];
      });

      const options: BatchParsingOptions = {
        onProgress: progressCallback,
        batchSize: 10,
      };

      await parseIngredientsInBatches(ingredients, mockParseFunction, options);

      // Verify time estimation in progress callbacks
      const lastProgress = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
      expect(lastProgress.estimatedTimeRemainingMs).toBeGreaterThanOrEqual(0);
    });

    it('should track parsing duration', async () => {
      const ingredients = ['ingredient 1', 'ingredient 2'];

      mockParseFunction.mockImplementation(async (batch: string[]) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return batch.map((text) => ({
          originalText: text,
          ingredientName: text,
          quantity: null,
          unit: null,
          preparationNotes: null,
          metricQuantity: null,
          metricUnit: null,
          confidence: 1.0,
          parsingMethod: 'ai',
          requiresManualReview: false,
        })) as ParsedIngredient[];
      });

      const options: BatchParsingOptions = {
        batchSize: 1,
      };

      const result = await parseIngredientsInBatches(ingredients, mockParseFunction, options);

      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(100); // At least 50ms * 2 batches
    });
  });

  describe('validateIngredientBatch', () => {
    it('should validate correct ingredient batch', () => {
      const ingredients = ['2 cups flour', '1 tsp salt', '3 eggs'];
      const result = validateIngredientBatch(ingredients);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty array', () => {
      const result = validateIngredientBatch([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingredients array cannot be empty');
    });

    it('should reject ingredients exceeding max length', () => {
      const longIngredient = 'a'.repeat(501); // Assuming max is 500
      const ingredients = ['2 cups flour', longIngredient];
      const result = validateIngredientBatch(ingredients);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('calculateOptimalBatchSize', () => {
    it('should return total for small batches', () => {
      expect(calculateOptimalBatchSize(10, 20)).toBe(10);
      expect(calculateOptimalBatchSize(15, 20)).toBe(15);
    });

    it('should distribute evenly across multiple batches', () => {
      // 25 ingredients with max 20 = 2 batches of 13, 12
      expect(calculateOptimalBatchSize(25, 20)).toBe(13);
    });

    it('should handle exactly max size', () => {
      expect(calculateOptimalBatchSize(20, 20)).toBe(20);
    });

    it('should distribute three batches evenly', () => {
      // 45 ingredients with max 20 = 3 batches of 15 each
      expect(calculateOptimalBatchSize(45, 20)).toBe(15);
    });

    it('should handle large ingredient counts', () => {
      const result = calculateOptimalBatchSize(100, 20);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('estimateParsingTime', () => {
    it('should estimate time for single batch', () => {
      const time = estimateParsingTime(10); // Less than batch size
      expect(time).toBe(2000); // 1 batch * 2000ms
    });

    it('should estimate time for multiple batches', () => {
      const time = estimateParsingTime(30); // Assuming batch size 20 = 2 batches
      expect(time).toBeGreaterThan(2000);
    });

    it('should use custom average time per batch', () => {
      const time = estimateParsingTime(30, 1000);
      expect(time).toBeGreaterThan(0);
    });

    it('should handle zero ingredients', () => {
      const time = estimateParsingTime(0);
      expect(time).toBe(0);
    });
  });

  describe('createInitialProgress', () => {
    it('should create initial progress for small batch', () => {
      const progress = createInitialProgress(10);
      expect(progress.currentBatch).toBe(0);
      expect(progress.parsedCount).toBe(0);
      expect(progress.totalCount).toBe(10);
      expect(progress.canCancel).toBe(true);
    });

    it('should create initial progress for large batch', () => {
      const progress = createInitialProgress(30);
      expect(progress.totalBatches).toBeGreaterThan(1);
      expect(progress.estimatedTimeRemainingMs).toBeGreaterThan(0);
    });

    it('should handle zero ingredients', () => {
      const progress = createInitialProgress(0);
      expect(progress.totalCount).toBe(0);
      expect(progress.totalBatches).toBe(0);
    });
  });

  describe('needsBatchProcessing', () => {
    it('should return false for small ingredient counts', () => {
      expect(needsBatchProcessing(10)).toBe(false);
      expect(needsBatchProcessing(15)).toBe(false);
      expect(needsBatchProcessing(20)).toBe(false);
    });

    it('should return true for large ingredient counts', () => {
      expect(needsBatchProcessing(21)).toBe(true);
      expect(needsBatchProcessing(30)).toBe(true);
      expect(needsBatchProcessing(100)).toBe(true);
    });
  });

  describe('formatProgressPercentage', () => {
    it('should format progress as percentage', () => {
      const progress = {
        currentBatch: 1,
        totalBatches: 2,
        parsedCount: 15,
        totalCount: 30,
        estimatedTimeRemainingMs: 2000,
        canCancel: true,
      };
      expect(formatProgressPercentage(progress)).toBe(50);
    });

    it('should handle 0% progress', () => {
      const progress = {
        currentBatch: 0,
        totalBatches: 2,
        parsedCount: 0,
        totalCount: 30,
        estimatedTimeRemainingMs: 4000,
        canCancel: true,
      };
      expect(formatProgressPercentage(progress)).toBe(0);
    });

    it('should handle 100% progress', () => {
      const progress = {
        currentBatch: 2,
        totalBatches: 2,
        parsedCount: 30,
        totalCount: 30,
        estimatedTimeRemainingMs: 0,
        canCancel: false,
      };
      expect(formatProgressPercentage(progress)).toBe(100);
    });

    it('should handle zero total count', () => {
      const progress = {
        currentBatch: 0,
        totalBatches: 0,
        parsedCount: 0,
        totalCount: 0,
        estimatedTimeRemainingMs: 0,
        canCancel: false,
      };
      expect(formatProgressPercentage(progress)).toBe(0);
    });

    it('should round to nearest integer', () => {
      const progress = {
        currentBatch: 1,
        totalBatches: 1,
        parsedCount: 5,
        totalCount: 9,
        estimatedTimeRemainingMs: 1000,
        canCancel: true,
      };
      // 5/9 = 0.555... = 56%
      expect(formatProgressPercentage(progress)).toBe(56);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format milliseconds less than 1 second', () => {
      expect(formatTimeRemaining(500)).toBe('<1s');
      expect(formatTimeRemaining(999)).toBe('<1s');
    });

    it('should format seconds', () => {
      expect(formatTimeRemaining(5000)).toBe('5s');
      expect(formatTimeRemaining(30000)).toBe('30s');
      expect(formatTimeRemaining(59000)).toBe('59s');
    });

    it('should format minutes without seconds', () => {
      expect(formatTimeRemaining(60000)).toBe('1m');
      expect(formatTimeRemaining(120000)).toBe('2m');
      expect(formatTimeRemaining(300000)).toBe('5m');
    });

    it('should format minutes with seconds', () => {
      expect(formatTimeRemaining(90000)).toBe('1m 30s');
      expect(formatTimeRemaining(125000)).toBe('2m 5s');
      expect(formatTimeRemaining(195000)).toBe('3m 15s');
    });

    it('should round to nearest second', () => {
      expect(formatTimeRemaining(5400)).toBe('5s'); // 5.4s rounds to 5s
      expect(formatTimeRemaining(5600)).toBe('6s'); // 5.6s rounds to 6s
    });
  });
});
