/**
 * Ingredient batch parsing utilities
 * Handles splitting large ingredient lists into batches and tracking progress
 * @module utils/ingredients/batchParser
 */

import type { ParsedIngredient } from '@/models/ParsedIngredient';
import type { IngredientParsingProgress } from '@/screens/recipe-management/types/state';
import { INGREDIENT_PARSING } from '@/screens/recipe-management/config/importConfig';

/**
 * Options for batch parsing
 */
export interface BatchParsingOptions {
  /** Progress callback fired after each batch completes */
  onProgress?: (progress: IngredientParsingProgress) => void;

  /** Abort signal for cancellation support */
  signal?: AbortSignal;

  /** Batch size (defaults to config MAX_BATCH_SIZE) */
  batchSize?: number;
}

/**
 * Result from batch parsing
 */
export interface BatchParsingResult {
  /** Successfully parsed ingredients */
  parsedIngredients: ParsedIngredient[];

  /** Ingredients that failed to parse */
  failedIngredients: string[];

  /** Total batches processed */
  totalBatches: number;

  /** Total parsing duration in milliseconds */
  durationMs: number;
}

/**
 * Splits an array into chunks of specified size
 *
 * @param array - Array to split
 * @param size - Chunk size
 * @returns Array of chunks
 *
 * @example
 * ```typescript
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Parses ingredients in batches with progress tracking
 *
 * @param ingredients - Array of ingredient strings to parse
 * @param parseFunction - Function to parse a batch of ingredients
 * @param options - Batch parsing options
 * @returns Batch parsing result with parsed ingredients and failures
 *
 * @example
 * ```typescript
 * const result = await parseIngredientsInBatches(
 *   largeIngredientList,
 *   parseIngredients,
 *   {
 *     onProgress: (progress) => {
 *       console.log(`${progress.parsedCount}/${progress.totalCount}`);
 *     },
 *     signal: abortController.signal
 *   }
 * );
 * ```
 */
export async function parseIngredientsInBatches(
  ingredients: string[],
  parseFunction: (batch: string[]) => Promise<ParsedIngredient[]>,
  options: BatchParsingOptions = {}
): Promise<BatchParsingResult> {
  const startTime = Date.now();
  const batchSize = options.batchSize ?? INGREDIENT_PARSING.MAX_BATCH_SIZE;
  const batches = chunk(ingredients, batchSize);
  const totalBatches = batches.length;

  const parsedIngredients: ParsedIngredient[] = [];
  const failedIngredients: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    // Check for cancellation
    if (options.signal?.aborted) {
      throw new DOMException('Ingredient parsing was cancelled', 'AbortError');
    }

    const batch = batches[i];

    try {
      // Parse current batch
      const batchResults = await parseFunction(batch);
      parsedIngredients.push(...batchResults);
    } catch (error) {
      // If batch fails, mark all ingredients in this batch as failed
      console.error(`Batch ${i + 1} failed:`, error);
      failedIngredients.push(...batch);
    }

    // Calculate progress
    const elapsedTime = Date.now() - startTime;
    const averageTimePerBatch = elapsedTime / (i + 1);
    const remainingBatches = totalBatches - (i + 1);
    const estimatedTimeRemaining = remainingBatches * averageTimePerBatch;

    // Fire progress callback
    if (options.onProgress) {
      const progress: IngredientParsingProgress = {
        currentBatch: i + 1,
        totalBatches,
        parsedCount: parsedIngredients.length + failedIngredients.length,
        totalCount: ingredients.length,
        estimatedTimeRemainingMs: Math.round(estimatedTimeRemaining),
        canCancel: true,
      };
      options.onProgress(progress);
    }
  }

  return {
    parsedIngredients,
    failedIngredients,
    totalBatches,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Validates ingredient batch before parsing
 *
 * @param ingredients - Array of ingredient strings to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const result = validateIngredientBatch(['2 cups flour', 'salt']);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateIngredientBatch(ingredients: string[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(ingredients)) {
    return { valid: false, error: 'Ingredients must be an array' };
  }

  if (ingredients.length === 0) {
    return { valid: false, error: 'Ingredients array cannot be empty' };
  }

  // Check each ingredient
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];

    if (typeof ingredient !== 'string') {
      return { valid: false, error: `Ingredient at index ${i} must be a string` };
    }

    if (ingredient.length > INGREDIENT_PARSING.MAX_LENGTH) {
      return {
        valid: false,
        error: `Ingredient at index ${i} exceeds ${INGREDIENT_PARSING.MAX_LENGTH} characters`,
      };
    }
  }

  return { valid: true };
}

/**
 * Calculates optimal batch size based on ingredient count
 * Ensures even distribution and efficient processing
 *
 * @param totalIngredients - Total number of ingredients
 * @param maxBatchSize - Maximum batch size (defaults to config)
 * @returns Optimal batch size
 *
 * @example
 * ```typescript
 * calculateOptimalBatchSize(25, 20) // 13 (two batches of 13, 12)
 * calculateOptimalBatchSize(15, 20) // 15 (one batch)
 * calculateOptimalBatchSize(45, 20) // 15 (three batches of 15)
 * ```
 */
export function calculateOptimalBatchSize(
  totalIngredients: number,
  maxBatchSize: number = INGREDIENT_PARSING.MAX_BATCH_SIZE
): number {
  if (totalIngredients <= maxBatchSize) {
    return totalIngredients;
  }

  // Calculate number of batches needed
  const numBatches = Math.ceil(totalIngredients / maxBatchSize);

  // Distribute evenly across batches
  return Math.ceil(totalIngredients / numBatches);
}

/**
 * Estimates total parsing time based on ingredient count
 *
 * @param ingredientCount - Number of ingredients to parse
 * @param averageTimePerBatch - Average time per batch in ms (defaults to 2000ms)
 * @returns Estimated time in milliseconds
 *
 * @example
 * ```typescript
 * estimateParsingTime(30) // ~4000ms (two batches at 2000ms each)
 * ```
 */
export function estimateParsingTime(ingredientCount: number, averageTimePerBatch: number = 2000): number {
  const batchSize = INGREDIENT_PARSING.MAX_BATCH_SIZE;
  const numBatches = Math.ceil(ingredientCount / batchSize);
  return numBatches * averageTimePerBatch;
}

/**
 * Creates a progress object for initial state
 *
 * @param totalCount - Total ingredients to parse
 * @returns Initial progress object
 *
 * @example
 * ```typescript
 * const progress = createInitialProgress(30);
 * // { currentBatch: 0, totalBatches: 2, parsedCount: 0, totalCount: 30, ... }
 * ```
 */
export function createInitialProgress(totalCount: number): IngredientParsingProgress {
  const batchSize = INGREDIENT_PARSING.MAX_BATCH_SIZE;
  const totalBatches = Math.ceil(totalCount / batchSize);

  return {
    currentBatch: 0,
    totalBatches,
    parsedCount: 0,
    totalCount,
    estimatedTimeRemainingMs: estimateParsingTime(totalCount),
    canCancel: true,
  };
}

/**
 * Checks if ingredient count requires batch processing
 *
 * @param ingredientCount - Number of ingredients
 * @returns True if batch processing is needed
 *
 * @example
 * ```typescript
 * needsBatchProcessing(15) // false
 * needsBatchProcessing(25) // true
 * ```
 */
export function needsBatchProcessing(ingredientCount: number): boolean {
  return ingredientCount > INGREDIENT_PARSING.MAX_BATCH_SIZE;
}

/**
 * Formats progress as a percentage
 *
 * @param progress - Progress object
 * @returns Percentage (0-100)
 *
 * @example
 * ```typescript
 * formatProgressPercentage({ parsedCount: 15, totalCount: 30 }) // 50
 * ```
 */
export function formatProgressPercentage(progress: IngredientParsingProgress): number {
  if (progress.totalCount === 0) return 0;
  return Math.round((progress.parsedCount / progress.totalCount) * 100);
}

/**
 * Formats estimated time remaining as human-readable string
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "2s", "1m 30s")
 *
 * @example
 * ```typescript
 * formatTimeRemaining(5000) // "5s"
 * formatTimeRemaining(90000) // "1m 30s"
 * ```
 */
export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) return '<1s';

  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}
