/**
 * State types for recipe import feature
 * @module state
 */

import type { IRecipe } from './Recipe';
import type { ImportError, ValidationWarning } from './errors';

/**
 * Import flow state machine
 * Represents the current state of the import process using a discriminated union
 */
export type ImportFlowState =
  | { status: 'idle' }
  | {
      status: 'parsing-json';
      startedAt: number;
    }
  | {
      status: 'parsing-ingredients';
      current: number;
      total: number;
      startedAt: number;
    }
  | {
      status: 'complete';
      recipe: Partial<IRecipe>;
      completedAt: number;
      startedAt: number;
      warnings?: ValidationWarning[];
    }
  | {
      status: 'error';
      error: ImportError;
      startedAt: number;
      recoverable: boolean;
      failedAt: number;
    };

/**
 * Progress information for ingredient parsing
 */
export interface IngredientParsingProgress {
  /** Current batch number (1-indexed) */
  currentBatch: number;

  /** Total number of batches */
  totalBatches: number;

  /** Number of ingredients parsed so far */
  parsedCount: number;

  /** Total ingredients to parse */
  totalCount: number;

  /** Estimated time remaining in milliseconds */
  estimatedTimeRemainingMs: number;

  /** Whether cancellation is supported */
  canCancel: boolean;
}

/**
 * Recipe parse result from JSON-LD parsing
 */
export interface RecipeParseResult {
  /** Whether parsing completed without critical errors */
  success: boolean;

  /** Partial recipe object (may be incomplete if warnings present) */
  recipe?: Partial<IRecipe>;

  /** Critical validation errors that prevent import */
  errors: import('./errors').ValidationError[];

  /** Non-critical issues that user should review */
  warnings: ValidationWarning[];

  /** Parsing context and timing information */
  metadata: {
    parsedAt: Date;
    sourceUrl?: string;
    rawJsonLd: string;
    parsingDurationMs: number;
  };
}

/**
 * Type guard to check if state is idle
 */
export function isIdleState(state: ImportFlowState): state is { status: 'idle' } {
  return state.status === 'idle';
}

/**
 * Type guard to check if state is parsing JSON
 */
export function isParsingJsonState(
  state: ImportFlowState
): state is { status: 'parsing-json'; startedAt: number } {
  return state.status === 'parsing-json';
}

/**
 * Type guard to check if state is parsing ingredients
 */
export function isParsingIngredientsState(
  state: ImportFlowState
): state is { status: 'parsing-ingredients'; current: number; total: number; startedAt: number } {
  return state.status === 'parsing-ingredients';
}

/**
 * Type guard to check if state is complete
 */
export function isCompleteState(
  state: ImportFlowState
): state is { status: 'complete'; recipe: Partial<IRecipe>; completedAt: number; startedAt: number; warnings?: ValidationWarning[] } {
  return state.status === 'complete';
}

/**
 * Type guard to check if state is error
 */
export function isErrorState(
  state: ImportFlowState
): state is { status: 'error'; error: ImportError; recoverable: boolean; startedAt: number; failedAt: number } {
  return state.status === 'error';
}

/**
 * Calculate progress percentage from parsing state
 */
export function calculateProgress(state: ImportFlowState): number {
  if (isParsingIngredientsState(state)) {
    return state.total > 0 ? (state.current / state.total) * 100 : 0;
  }
  return 0;
}

/**
 * Get duration of current operation in milliseconds
 */
export function getOperationDuration(state: ImportFlowState): number {
  const now = Date.now();

  if (isParsingJsonState(state)) {
    return now - state.startedAt;
  }

  if (isParsingIngredientsState(state)) {
    return now - state.startedAt;
  }

  if (isCompleteState(state)) {
    return state.completedAt - state.startedAt || 0;
  }

  if (isErrorState(state)) {
    return state.failedAt - state.startedAt || 0;
  }

  return 0;
}

/**
 * Type guard to check if state allows cancellation
 */
export function canCancelOperation(state: ImportFlowState): boolean {
  return isParsingIngredientsState(state);
}

/**
 * Type guard to check if state allows retry
 */
export function canRetryOperation(state: ImportFlowState): boolean {
  return isErrorState(state) && state.recoverable;
}

/**
 * Type guard to check if state allows import
 */
export function canImportRecipe(state: ImportFlowState): boolean {
  return isCompleteState(state) && !!state.recipe.name && !!state.recipe.image;
}

/**
 * Validation error type (re-exported from errors module)
 */
export type { ValidationError } from './errors';
