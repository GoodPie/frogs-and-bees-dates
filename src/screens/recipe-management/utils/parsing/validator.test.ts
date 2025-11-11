/**
 * Unit tests for recipe validator
 * Tests required field validation, optional field warnings, and data quality checks
 * @module utils/parsing/validator.test
 */

import { describe, it, expect } from 'vitest';
import type { IRecipe } from '@/screens/recipe-management/types/Recipe';
import {
  validateRequiredFields,
  validateOptionalFields,
  validateDataQuality,
  validateRecipe,
  isValidUrl,
  hasMinimumViableContent,
  validateIngredients,
  validateInstructions,
  createValidationError,
  createValidationWarning,
} from './validator';

describe('validateRequiredFields', () => {
  it('should pass with name and image', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(0);
  });

  it('should fail without name', () => {
    const recipe: Partial<IRecipe> = {
      image: 'https://example.com/image.jpg',
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('name');
    expect(errors[0].type).toBe('missing_required_field');
  });

  it('should fail with empty name', () => {
    const recipe: Partial<IRecipe> = {
      name: '   ',
      image: 'https://example.com/image.jpg',
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('name');
  });

  it('should fail without image', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('image');
    expect(errors[0].type).toBe('missing_required_field');
  });

  it('should fail with empty image', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: '   ',
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('image');
  });

  it('should fail with both missing', () => {
    const recipe: Partial<IRecipe> = {};
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(2);
  });

  it('should handle image array (first element used)', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: ['https://example.com/image.jpg', 'https://example.com/image2.jpg'],
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(0);
  });

  it('should fail with empty image array', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: [],
    };
    const errors = validateRequiredFields(recipe);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('image');
  });
});

describe('validateOptionalFields', () => {
  it('should warn about missing ingredients', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const warnings = validateOptionalFields(recipe);
    const ingredientWarning = warnings.find((w) => w.field === 'recipeIngredient');
    expect(ingredientWarning).toBeTruthy();
  });

  it('should warn about missing instructions', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const warnings = validateOptionalFields(recipe);
    const instructionWarning = warnings.find((w) => w.field === 'recipeInstructions');
    expect(instructionWarning).toBeTruthy();
  });

  it('should warn about missing recipe yield', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const warnings = validateOptionalFields(recipe);
    const yieldWarning = warnings.find((w) => w.field === 'recipeYield');
    expect(yieldWarning).toBeTruthy();
  });

  it('should warn about missing timing info', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const warnings = validateOptionalFields(recipe);
    const timingWarning = warnings.find((w) => w.field?.includes('Time'));
    expect(timingWarning).toBeTruthy();
  });

  it('should not warn when all optional fields present', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
      recipeIngredient: ['flour', 'sugar'],
      recipeInstructions: ['Mix', 'Bake'],
      recipeYield: '8 servings',
      prepTime: 'PT15M',
      cookTime: 'PT30M',
    };
    const warnings = validateOptionalFields(recipe);
    expect(warnings).toHaveLength(0);
  });

  it('should handle empty arrays as missing', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
      recipeIngredient: [],
      recipeInstructions: [],
    };
    const warnings = validateOptionalFields(recipe);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe('validateDataQuality', () => {
  it('should warn about invalid image URL', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'not-a-valid-url',
    };
    const warnings = validateDataQuality(recipe);
    const imageWarning = warnings.find((w) => w.field === 'image');
    expect(imageWarning).toBeTruthy();
  });

  it('should warn about very few ingredients', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
      recipeIngredient: ['salt'],
    };
    const warnings = validateDataQuality(recipe);
    const ingredientWarning = warnings.find((w) => w.field === 'recipeIngredient');
    expect(ingredientWarning).toBeTruthy();
    expect(ingredientWarning?.message).toContain('1 ingredient');
  });

  it('should warn about single instruction', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
      recipeInstructions: ['Cook everything'],
    };
    const warnings = validateDataQuality(recipe);
    const instructionWarning = warnings.find((w) => w.field === 'recipeInstructions');
    expect(instructionWarning).toBeTruthy();
  });

  it('should warn about very short name', () => {
    const recipe: Partial<IRecipe> = {
      name: 'AB',
      image: 'https://example.com/image.jpg',
    };
    const warnings = validateDataQuality(recipe);
    const nameWarning = warnings.find((w) => w.field === 'name');
    expect(nameWarning).toBeTruthy();
  });

  it('should not warn for high-quality data', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Delicious Chocolate Cake',
      image: 'https://example.com/image.jpg',
      recipeIngredient: ['flour', 'sugar', 'cocoa', 'eggs'],
      recipeInstructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake'],
    };
    const warnings = validateDataQuality(recipe);
    expect(warnings).toHaveLength(0);
  });
});

describe('validateRecipe', () => {
  it('should combine all validation checks', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const result = validateRecipe(recipe);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.isValid).toBe(true);
  });

  it('should mark invalid if required fields missing', () => {
    const recipe: Partial<IRecipe> = {
      name: '',
    };
    const result = validateRecipe(recipe);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should be valid with only warnings', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    const result = validateRecipe(recipe);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('isValidUrl', () => {
  it('should accept https URLs', () => {
    expect(isValidUrl('https://example.com/image.jpg')).toBe(true);
  });

  it('should accept http URLs', () => {
    expect(isValidUrl('http://example.com/image.jpg')).toBe(true);
  });

  it('should reject relative paths', () => {
    expect(isValidUrl('/path/to/image.jpg')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should reject file:// protocol', () => {
    expect(isValidUrl('file:///path/to/file')).toBe(false);
  });

  it('should reject ftp:// protocol', () => {
    expect(isValidUrl('ftp://example.com/file')).toBe(false);
  });

  it('should handle URLs with query params', () => {
    expect(isValidUrl('https://example.com/image.jpg?w=500&h=300')).toBe(true);
  });

  it('should handle URLs with fragments', () => {
    expect(isValidUrl('https://example.com/page#section')).toBe(true);
  });
});

describe('hasMinimumViableContent', () => {
  it('should return true with name and image', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
    };
    expect(hasMinimumViableContent(recipe)).toBe(true);
  });

  it('should return false without name', () => {
    const recipe: Partial<IRecipe> = {
      image: 'https://example.com/image.jpg',
    };
    expect(hasMinimumViableContent(recipe)).toBe(false);
  });

  it('should return false without image', () => {
    const recipe: Partial<IRecipe> = {
      name: 'Test Recipe',
    };
    expect(hasMinimumViableContent(recipe)).toBe(false);
  });

  it('should return false with empty strings', () => {
    const recipe: Partial<IRecipe> = {
      name: '   ',
      image: '   ',
    };
    expect(hasMinimumViableContent(recipe)).toBe(false);
  });
});

describe('validateIngredients', () => {
  it('should validate normal ingredient list', () => {
    const ingredients = ['2 cups flour', '1 tsp salt', '1/2 cup sugar'];
    const result = validateIngredients(ingredients);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn about empty array', () => {
    const result = validateIngredients([]);
    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should warn about undefined', () => {
    const result = validateIngredients(undefined);
    expect(result.valid).toBe(false);
  });

  it('should warn about very short ingredients', () => {
    const ingredients = ['ab', 'flour', 'x'];
    const result = validateIngredients(ingredients);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('very short');
  });

  it('should warn about very long ingredients', () => {
    const longIngredient = 'a'.repeat(250);
    const ingredients = ['flour', longIngredient];
    const result = validateIngredients(ingredients);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('very long');
  });
});

describe('validateInstructions', () => {
  it('should validate normal instruction list', () => {
    const instructions = ['Mix dry ingredients', 'Add wet ingredients', 'Bake at 350F'];
    const result = validateInstructions(instructions);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn about empty array', () => {
    const result = validateInstructions([]);
    expect(result.valid).toBe(false);
  });

  it('should warn about undefined', () => {
    const result = validateInstructions(undefined);
    expect(result.valid).toBe(false);
  });

  it('should warn about very short instructions', () => {
    const instructions = ['Mix', 'abc', 'Bake at 350F'];
    const result = validateInstructions(instructions);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('very short');
  });
});

describe('createValidationError', () => {
  it('should create validation error with all fields', () => {
    const error = createValidationError(
      'missing_required_field',
      'name',
      'Name is required',
      'Field not found in JSON'
    );
    expect(error.type).toBe('missing_required_field');
    expect(error.field).toBe('name');
    expect(error.message).toBe('Name is required');
    expect(error.details).toBe('Field not found in JSON');
    expect(error.severity).toBe('error');
  });

  it('should create validation error without details', () => {
    const error = createValidationError('invalid_format', 'image', 'Invalid URL');
    expect(error.details).toBeUndefined();
  });
});

describe('createValidationWarning', () => {
  it('should create validation warning with actionable true', () => {
    const warning = createValidationWarning(
      'missing_optional_field',
      'recipeYield',
      'No serving size'
    );
    expect(warning.type).toBe('missing_optional_field');
    expect(warning.field).toBe('recipeYield');
    expect(warning.message).toBe('No serving size');
    expect(warning.actionable).toBe(true);
    expect(warning.severity).toBe('warning');
  });

  it('should create validation warning with actionable false', () => {
    const warning = createValidationWarning(
      'data_quality',
      'name',
      'Name is short',
      false
    );
    expect(warning.actionable).toBe(false);
  });
});
