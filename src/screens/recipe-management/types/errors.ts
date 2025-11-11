/**
 * Error types for recipe import feature
 * @module errors
 */

import type { ParsedIngredient } from '@/models/ParsedIngredient';

/**
 * Validation error representing a critical issue that prevents import
 */
export interface ValidationError {
  /** Category of validation error */
  type: 'missing_required_field' | 'invalid_format' | 'schema_mismatch';

  /** Which recipe field failed validation (if applicable) */
  field?: string;

  /** User-facing error description */
  message: string;

  /** Technical details for debugging */
  details?: string;

  /** Always 'error' for this type */
  severity: 'error';
}

/**
 * Validation warning representing a non-critical issue for user review
 */
export interface ValidationWarning {
  /** Category of warning */
  type: 'missing_optional_field' | 'low_confidence' | 'data_quality';

  /** Which recipe field has the issue (if applicable) */
  field?: string;

  /** User-facing warning description */
  message: string;

  /** Can user fix this? */
  actionable: boolean;

  /** Always 'warning' for this type */
  severity: 'warning';
}

/**
 * Discriminated union of all possible import errors
 */
export type ImportError =
  | {
      type: 'json_parse';
      message: string;
      details: string;
      line?: number;
      column?: number;
    }
  | {
      type: 'json_invalid_schema';
      message: string;
      receivedType: string;
      expectedType: 'Recipe';
    }
  | {
      type: 'validation';
      errors: ValidationError[];
    }
  | {
      type: 'ingredient_parse';
      failedIngredients: string[];
      partialResults: ParsedIngredient[];
      originalError: Error;
    }
  | {
      type: 'network';
      message: string;
      retryable: boolean;
      statusCode?: number;
    }
  | {
      type: 'size_limit';
      actual: number;
      limit: number;
      unit: 'bytes' | 'ingredients';
    }
  | {
      type: 'timeout';
      operation: string;
      timeoutMs: number;
    };

/**
 * Type guard to check if error is recoverable
 */
export function isRecoverableError(error: ImportError): boolean {
  switch (error.type) {
    case 'json_parse':
    case 'validation':
    case 'ingredient_parse':
    case 'network':
    case 'timeout':
      return true;
    case 'json_invalid_schema':
    case 'size_limit':
      return false;
    default:
      return false;
  }
}

/**
 * Create a user-friendly error message from ImportError
 */
export function formatImportError(error: ImportError): string {
  switch (error.type) {
    case 'json_parse':
      return error.line
        ? `Invalid JSON at line ${error.line}: ${error.message}`
        : `Invalid JSON: ${error.message}`;

    case 'json_invalid_schema':
      return `Expected Recipe schema but found ${error.receivedType}. Make sure you're copying the recipe JSON-LD data.`;

    case 'validation':
      return `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`;

    case 'ingredient_parse':
      return `Failed to parse ${error.failedIngredients.length} ingredients. ${error.partialResults.length} parsed successfully.`;

    case 'network':
      return error.retryable
        ? `Network error: ${error.message}. Please try again.`
        : `Network error: ${error.message}`;

    case 'size_limit':
      return `Input too large: ${error.actual} ${error.unit} (limit: ${error.limit} ${error.unit})`;

    case 'timeout':
      return `${error.operation} timed out after ${error.timeoutMs}ms. Please try again.`;

    default:
      return 'An unknown error occurred';
  }
}

/**
 * Get recovery suggestion for an error
 */
export function getRecoverySuggestion(error: ImportError): string | null {
  switch (error.type) {
    case 'json_parse':
      return 'Check the JSON-LD format and try again. Make sure you copied the entire JSON-LD block from the recipe website.';

    case 'json_invalid_schema':
      return 'This doesn\'t appear to be a recipe. Look for JSON-LD data with @type: "Recipe" on the recipe website.';

    case 'validation':
      return 'Fix the missing required fields and try importing again.';

    case 'ingredient_parse':
      return 'You can continue with the successfully parsed ingredients and manually edit the failed ones.';

    case 'network':
      return error.retryable ? 'Click retry to try again.' : null;

    case 'size_limit':
      return error.unit === 'bytes'
        ? 'The JSON-LD is too large. Try copying a smaller portion or contact support.'
        : 'This recipe has too many ingredients. Try removing some or contact support.';

    case 'timeout':
      return 'The operation took too long. Click retry to try again.';

    default:
      return null;
  }
}
