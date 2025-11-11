/**
 * Unit tests for error types
 * Verifies discriminated union exhaustiveness and error utility functions
 * @module types/__tests__/errors.test
 */

import { describe, it, expect } from 'vitest';
import type { ImportError, ValidationError, ValidationWarning } from '../errors';
import {
  isRecoverableError,
  formatImportError,
  getRecoverySuggestion,
} from '../errors';

describe('ImportError discriminated union', () => {
  it('should handle json_parse error', () => {
    const error: ImportError = {
      type: 'json_parse',
      message: 'Unexpected token',
      details: 'Invalid JSON syntax',
      line: 5,
      column: 10,
    };
    expect(error.type).toBe('json_parse');
    expect(error.line).toBe(5);
  });

  it('should handle json_invalid_schema error', () => {
    const error: ImportError = {
      type: 'json_invalid_schema',
      message: 'Not a recipe',
      receivedType: 'Article',
      expectedType: 'Recipe',
    };
    expect(error.type).toBe('json_invalid_schema');
    expect(error.receivedType).toBe('Article');
  });

  it('should handle validation error', () => {
    const validationError: ValidationError = {
      type: 'missing_required_field',
      field: 'name',
      message: 'Name is required',
      severity: 'error',
    };
    const error: ImportError = {
      type: 'validation',
      errors: [validationError],
    };
    expect(error.type).toBe('validation');
    expect(error.errors).toHaveLength(1);
  });

  it('should handle ingredient_parse error', () => {
    const error: ImportError = {
      type: 'ingredient_parse',
      failedIngredients: ['salt', 'pepper'],
      partialResults: [],
      originalError: new Error('AI service failed'),
    };
    expect(error.type).toBe('ingredient_parse');
    expect(error.failedIngredients).toHaveLength(2);
  });

  it('should handle network error', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Connection timeout',
      retryable: true,
      statusCode: 504,
    };
    expect(error.type).toBe('network');
    expect(error.retryable).toBe(true);
  });

  it('should handle size_limit error', () => {
    const error: ImportError = {
      type: 'size_limit',
      actual: 3000000,
      limit: 2097152,
      unit: 'bytes',
    };
    expect(error.type).toBe('size_limit');
    expect(error.unit).toBe('bytes');
  });

  it('should handle timeout error', () => {
    const error: ImportError = {
      type: 'timeout',
      operation: 'JSON parsing',
      timeoutMs: 5000,
    };
    expect(error.type).toBe('timeout');
    expect(error.timeoutMs).toBe(5000);
  });
});

describe('isRecoverableError', () => {
  it('should mark json_parse as recoverable', () => {
    const error: ImportError = {
      type: 'json_parse',
      message: 'Invalid JSON',
      details: 'Syntax error',
    };
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should mark validation as recoverable', () => {
    const error: ImportError = {
      type: 'validation',
      errors: [],
    };
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should mark ingredient_parse as recoverable', () => {
    const error: ImportError = {
      type: 'ingredient_parse',
      failedIngredients: [],
      partialResults: [],
      originalError: new Error(),
    };
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should mark network as recoverable', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Connection failed',
      retryable: true,
    };
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should mark timeout as recoverable', () => {
    const error: ImportError = {
      type: 'timeout',
      operation: 'parsing',
      timeoutMs: 5000,
    };
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should mark json_invalid_schema as NOT recoverable', () => {
    const error: ImportError = {
      type: 'json_invalid_schema',
      message: 'Wrong schema',
      receivedType: 'Article',
      expectedType: 'Recipe',
    };
    expect(isRecoverableError(error)).toBe(false);
  });

  it('should mark size_limit as NOT recoverable', () => {
    const error: ImportError = {
      type: 'size_limit',
      actual: 5000000,
      limit: 2097152,
      unit: 'bytes',
    };
    expect(isRecoverableError(error)).toBe(false);
  });
});

describe('formatImportError', () => {
  it('should format json_parse error with line number', () => {
    const error: ImportError = {
      type: 'json_parse',
      message: 'Unexpected token',
      details: 'Details',
      line: 10,
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('line 10');
    expect(formatted).toContain('Unexpected token');
  });

  it('should format json_parse error without line number', () => {
    const error: ImportError = {
      type: 'json_parse',
      message: 'Unexpected token',
      details: 'Details',
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Invalid JSON');
    expect(formatted).toContain('Unexpected token');
  });

  it('should format json_invalid_schema error', () => {
    const error: ImportError = {
      type: 'json_invalid_schema',
      message: 'Wrong type',
      receivedType: 'Article',
      expectedType: 'Recipe',
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Article');
    expect(formatted).toContain('Recipe');
  });

  it('should format validation error', () => {
    const error: ImportError = {
      type: 'validation',
      errors: [
        {
          type: 'missing_required_field',
          field: 'name',
          message: 'Name required',
          severity: 'error',
        },
        {
          type: 'missing_required_field',
          field: 'image',
          message: 'Image required',
          severity: 'error',
        },
      ],
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Validation failed');
    expect(formatted).toContain('Name required');
    expect(formatted).toContain('Image required');
  });

  it('should format ingredient_parse error', () => {
    const error: ImportError = {
      type: 'ingredient_parse',
      failedIngredients: ['salt', 'pepper', 'garlic'],
      partialResults: [],
      originalError: new Error(),
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('3 ingredients');
    expect(formatted).toContain('0 parsed successfully');
  });

  it('should format network error with retry', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Connection timeout',
      retryable: true,
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Network error');
    expect(formatted).toContain('try again');
  });

  it('should format network error without retry', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Unauthorized',
      retryable: false,
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Network error');
    expect(formatted).not.toContain('try again');
  });

  it('should format size_limit error with bytes', () => {
    const error: ImportError = {
      type: 'size_limit',
      actual: 3000000,
      limit: 2097152,
      unit: 'bytes',
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('too large');
    expect(formatted).toContain('3000000');
    expect(formatted).toContain('2097152');
  });

  it('should format timeout error', () => {
    const error: ImportError = {
      type: 'timeout',
      operation: 'Ingredient parsing',
      timeoutMs: 10000,
    };
    const formatted = formatImportError(error);
    expect(formatted).toContain('Ingredient parsing');
    expect(formatted).toContain('10000ms');
  });
});

describe('getRecoverySuggestion', () => {
  it('should provide suggestion for json_parse', () => {
    const error: ImportError = {
      type: 'json_parse',
      message: 'Invalid',
      details: 'Details',
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('JSON-LD format');
    expect(suggestion).toBeTruthy();
  });

  it('should provide suggestion for json_invalid_schema', () => {
    const error: ImportError = {
      type: 'json_invalid_schema',
      message: 'Wrong type',
      receivedType: 'Article',
      expectedType: 'Recipe',
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('@type: "Recipe"');
    expect(suggestion).toBeTruthy();
  });

  it('should provide suggestion for validation', () => {
    const error: ImportError = {
      type: 'validation',
      errors: [],
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('required fields');
    expect(suggestion).toBeTruthy();
  });

  it('should provide suggestion for ingredient_parse', () => {
    const error: ImportError = {
      type: 'ingredient_parse',
      failedIngredients: ['salt'],
      partialResults: [],
      originalError: new Error(),
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('continue');
    expect(suggestion).toContain('manually edit');
    expect(suggestion).toBeTruthy();
  });

  it('should provide retry suggestion for retryable network error', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Timeout',
      retryable: true,
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('retry');
    expect(suggestion).toBeTruthy();
  });

  it('should not provide suggestion for non-retryable network error', () => {
    const error: ImportError = {
      type: 'network',
      message: 'Unauthorized',
      retryable: false,
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toBeNull();
  });

  it('should provide suggestion for size_limit (bytes)', () => {
    const error: ImportError = {
      type: 'size_limit',
      actual: 3000000,
      limit: 2097152,
      unit: 'bytes',
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('too large');
    expect(suggestion).toBeTruthy();
  });

  it('should provide suggestion for size_limit (ingredients)', () => {
    const error: ImportError = {
      type: 'size_limit',
      actual: 50,
      limit: 20,
      unit: 'ingredients',
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('too many ingredients');
    expect(suggestion).toBeTruthy();
  });

  it('should provide suggestion for timeout', () => {
    const error: ImportError = {
      type: 'timeout',
      operation: 'parsing',
      timeoutMs: 5000,
    };
    const suggestion = getRecoverySuggestion(error);
    expect(suggestion).toContain('retry');
    expect(suggestion).toBeTruthy();
  });
});

describe('ValidationError type', () => {
  it('should have correct structure', () => {
    const error: ValidationError = {
      type: 'missing_required_field',
      field: 'name',
      message: 'Name is required',
      details: 'Field not found',
      severity: 'error',
    };
    expect(error.severity).toBe('error');
    expect(error.type).toBe('missing_required_field');
  });
});

describe('ValidationWarning type', () => {
  it('should have correct structure', () => {
    const warning: ValidationWarning = {
      type: 'missing_optional_field',
      field: 'recipeYield',
      message: 'No serving size',
      actionable: true,
      severity: 'warning',
    };
    expect(warning.severity).toBe('warning');
    expect(warning.actionable).toBe(true);
  });
});
