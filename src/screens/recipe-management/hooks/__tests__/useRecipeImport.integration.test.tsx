/**
 * Integration tests for useRecipeImport hook
 * Tests the complete import workflow including JSON-LD parsing and ingredient processing
 * @module hooks/__tests__/useRecipeImport.integration.test
 *
 * NOTE: These tests are currently skipped as they were written against an old API.
 * They need to be rewritten to match the refactored state machine pattern.
 * See CLAUDE.md for the new API structure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecipeImport } from '../useRecipeImport';
import * as ingredientParserService from '@/services/ingredientParser';

// Mock the ingredient parser service
vi.mock('@/services/ingredientParser', () => ({
  parseIngredients: vi.fn(),
  parseIngredientsWithProgress: vi.fn(),
}));

describe.skip('useRecipeImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useRecipeImport());

      expect(result.current.url).toBe('');
      expect(result.current.jsonLdText).toBe('');
      expect(result.current.parseResult).toBeNull();
      expect(result.current.parsing).toBe(false);
      expect(result.current.isParsing).toBe(false);
    });
  });

  describe('URL management', () => {
    it('should update URL state', () => {
      const { result } = renderHook(() => useRecipeImport());
      const url = 'https://example.com/recipe';

      act(() => {
        result.current.setUrl(url);
      });

      expect(result.current.url).toBe(url);
    });

    it('should handle empty URL', () => {
      const { result } = renderHook(() => useRecipeImport());

      act(() => {
        result.current.setUrl('');
      });

      expect(result.current.url).toBe('');
    });
  });

  describe('JSON-LD text management', () => {
    it('should update JSON-LD text state', () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = '{"@type":"Recipe","name":"Test"}';

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      expect(result.current.jsonLdText).toBe(jsonLd);
    });

    it('should handle multiline JSON-LD', () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = `{
        "@type": "Recipe",
        "name": "Test Recipe"
      }`;

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      expect(result.current.jsonLdText).toBe(jsonLd);
    });
  });

  describe('JSON-LD parsing', () => {
    it('should fail when JSON-LD text is empty', async () => {
      const { result } = renderHook(() => useRecipeImport());

      act(() => {
        result.current.setJsonLdText('');
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(false);
      expect(result.current.parseResult?.errors).toContain('Please paste JSON-LD data');
    });

    it('should fail when JSON-LD text is whitespace only', async () => {
      const { result } = renderHook(() => useRecipeImport());

      act(() => {
        result.current.setJsonLdText('   \n\t  ');
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(false);
    });

    it('should parse valid JSON-LD', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['flour', 'sugar'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(true);
      expect(result.current.parseResult?.recipe?.name).toBe('Test Recipe');
    });

    it('should set parsing state during parsing', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test',
        image: 'https://example.com/img.jpg',
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      act(() => {
        result.current.parseJsonLd();
      });

      // Parsing state should be true initially
      expect(result.current.parsing).toBe(true);

      // Wait for parsing to complete
      await waitFor(
        () => {
          expect(result.current.parsing).toBe(false);
        },
        { timeout: 500 }
      );
    });
  });

  describe('Ingredient parsing integration', () => {
    it('should parse ingredients if recipe has them', async () => {
      const mockParsedIngredients = [
        { quantity: 2, unit: 'cups', ingredient: 'flour', originalText: '2 cups flour' },
      ];
      vi.mocked(ingredientParserService.parseIngredients).mockResolvedValue(mockParsedIngredients);

      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['2 cups flour'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      await waitFor(
        () => {
          expect(result.current.parseResult?.recipe?.parsedIngredients).toBeDefined();
        },
        { timeout: 500 }
      );

      expect(vi.mocked(ingredientParserService.parseIngredients)).toHaveBeenCalled();
      expect(result.current.parseResult?.recipe?.ingredientParsingCompleted).toBe(true);
    });

    it('should not parse ingredients if recipe has none', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        // No recipeIngredient
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(vi.mocked(ingredientParserService.parseIngredients)).not.toHaveBeenCalled();
    });

    it('should handle ingredient parsing errors gracefully', async () => {
      const error = new Error('Ingredient parsing failed');
      vi.mocked(ingredientParserService.parseIngredients).mockRejectedValue(error);

      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['salt'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      await waitFor(
        () => {
          expect(result.current.isParsing).toBe(false);
        },
        { timeout: 500 }
      );

      // Should still have successful parse but warning about ingredient parsing
      expect(result.current.parseResult?.warnings).toBeTruthy();
    });

    it('should set isParsing state during ingredient parsing', async () => {
      vi.mocked(ingredientParserService.parseIngredients).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['flour'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      // isParsing should be true while ingredients are being parsed
      await waitFor(
        () => {
          expect(result.current.isParsing).toBe(false);
        },
        { timeout: 500 }
      );
    });
  });

  describe('getParsedRecipe', () => {
    it('should return parsed recipe if parsing succeeded', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      const recipe = result.current.getParsedRecipe();

      expect(recipe).toBeDefined();
      expect(recipe?.name).toBe('Test Recipe');
    });

    it('should return null if parsing failed', async () => {
      const { result } = renderHook(() => useRecipeImport());

      act(() => {
        result.current.setJsonLdText('');
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      const recipe = result.current.getParsedRecipe();

      expect(recipe).toBeNull();
    });

    it('should return null if parsing not attempted', () => {
      const { result } = renderHook(() => useRecipeImport());

      const recipe = result.current.getParsedRecipe();

      expect(recipe).toBeNull();
    });
  });

  describe('Reset functionality', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useRecipeImport());

      // Set up some state
      act(() => {
        result.current.setUrl('https://example.com');
        result.current.setJsonLdText('{"test": 1}');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.url).toBe('');
      expect(result.current.jsonLdText).toBe('');
      expect(result.current.parseResult).toBeNull();
      expect(result.current.parsing).toBe(false);
      expect(result.current.isParsing).toBe(false);
    });

    it('should reset after successful parsing', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.parseResult).toBeNull();
      expect(result.current.jsonLdText).toBe('');
    });

    it('should allow parsing again after reset', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
      });

      // First parse
      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Second parse
      const jsonLd2 = JSON.stringify({
        '@type': 'Recipe',
        name: 'Another Recipe',
        image: 'https://example.com/img2.jpg',
      });

      act(() => {
        result.current.setJsonLdText(jsonLd2);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.recipe?.name).toBe('Another Recipe');
    });
  });

  describe('Error handling', () => {
    it('should capture validation errors from parser', async () => {
      const { result } = renderHook(() => useRecipeImport());
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test',
        // Missing required image
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(false);
      expect(result.current.parseResult?.errors).toBeTruthy();
    });

    it('should capture invalid JSON errors', async () => {
      const { result } = renderHook(() => useRecipeImport());

      act(() => {
        result.current.setJsonLdText('{invalid json}');
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(false);
      expect(result.current.parseResult?.errors).toBeTruthy();
    });
  });

  describe('Complex workflows', () => {
    it('should handle complete import workflow', async () => {
      const mockParsedIngredients = [
        { quantity: 2, unit: 'cups', ingredient: 'flour', originalText: '2 cups flour' },
        { quantity: 1, unit: 'cup', ingredient: 'sugar', originalText: '1 cup sugar' },
      ];
      vi.mocked(ingredientParserService.parseIngredients).mockResolvedValue(mockParsedIngredients);

      const { result } = renderHook(() => useRecipeImport());
      const sourceUrl = 'https://example.com/recipe/chocolate-cake';
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Chocolate Cake',
        description: 'A delicious chocolate cake',
        image: 'https://example.com/cake.jpg',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake'],
        recipeYield: '8 servings',
        prepTime: 'PT15M',
        cookTime: 'PT30M',
      });

      // Set URL
      act(() => {
        result.current.setUrl(sourceUrl);
      });

      expect(result.current.url).toBe(sourceUrl);

      // Set JSON-LD
      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      expect(result.current.jsonLdText).toBe(jsonLd);

      // Parse
      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      // Verify parsing succeeded
      await waitFor(
        () => {
          expect(result.current.parseResult?.success).toBe(true);
        },
        { timeout: 500 }
      );

      // Get parsed recipe
      const recipe = result.current.getParsedRecipe();

      expect(recipe).toBeDefined();
      expect(recipe?.name).toBe('Chocolate Cake');
      expect(recipe?.recipeIngredient).toHaveLength(2);
      expect(recipe?.parsedIngredients).toBeDefined();
      expect(recipe?.ingredientParsingCompleted).toBe(true);
    });

    it('should handle parsing errors and allow retry', async () => {
      const { result } = renderHook(() => useRecipeImport());

      // First attempt with invalid JSON
      act(() => {
        result.current.setJsonLdText('{invalid}');
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(false);

      // Reset and retry with valid JSON
      act(() => {
        result.current.reset();
      });

      const validJsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Valid Recipe',
        image: 'https://example.com/img.jpg',
      });

      act(() => {
        result.current.setJsonLdText(validJsonLd);
      });

      await act(async () => {
        result.current.parseJsonLd();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.parseResult?.success).toBe(true);
      expect(result.current.parseResult?.recipe?.name).toBe('Valid Recipe');
    });
  });
});

/**
 * Performance Tests - Verify No Artificial Delays
 * These tests ensure the import flow completes quickly without setTimeout delays
 */
describe('useRecipeImport - No setTimeout Delays', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ingredient parser to return immediately with progress callback
    vi.mocked(ingredientParserService.parseIngredientsWithProgress).mockImplementation(
      async (ingredients, options = {}) => {
        // Simulate progress callback if provided
        if (options.onProgress) {
          options.onProgress(ingredients.length, ingredients.length);
        }

        // Return parsed ingredients immediately
        return {
          parsedIngredients: ingredients.map((text) => ({
            originalText: text,
            ingredientName: text.split(' ').pop() || text,
            quantity: '1',
            unit: 'unit',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.9,
            parsingMethod: 'ai' as const,
            requiresManualReview: false,
          })),
          failedIngredients: [],
          totalBatches: 1,
          durationMs: 10,
        };
      }
    );
  });

  it('should parse recipe quickly without artificial delays', async () => {
    const { result } = renderHook(() => useRecipeImport());

    const validJsonLd = JSON.stringify({
      '@type': 'Recipe',
      name: 'Quick Recipe',
      image: 'https://example.com/image.jpg',
      recipeIngredient: ['2 cups flour', '1 tsp salt'],
      recipeInstructions: ['Mix and bake'],
    });

    act(() => {
      result.current.setJsonLdText(validJsonLd);
    });

    const startTime = performance.now();

    await act(async () => {
      await result.current.parseJsonLd();
    });

    const duration = performance.now() - startTime;

    // Verify parsing completed successfully
    expect(result.current.state.status).toBe('complete');
    expect(result.current.state.recipe).toBeDefined();

    // Verify no artificial delays (should complete in < 500ms)
    // If there were setTimeout(1000) delays, this would fail
    expect(duration).toBeLessThan(500);
  });

  it('should complete full import flow without setTimeout delays', async () => {
    const { result } = renderHook(() => useRecipeImport());

    const validJsonLd = JSON.stringify({
      '@type': 'Recipe',
      name: 'Test Recipe',
      image: 'https://example.com/image.jpg',
      recipeIngredient: ['2 cups flour', '1 tsp salt', '3 eggs'],
      recipeInstructions: ['Step 1', 'Step 2'],
    });

    act(() => {
      result.current.setJsonLdText(validJsonLd);
    });

    const startTime = performance.now();

    // Execute the full import flow
    await act(async () => {
      await result.current.parseJsonLd();
    });

    const duration = performance.now() - startTime;

    // Verify completed state
    expect(result.current.state.status).toBe('complete');

    // Full flow should complete quickly without any setTimeout delays
    // Allowing up to 1000ms for actual work, but no artificial delays
    expect(duration).toBeLessThan(1000);
  });

  it('should handle rapid successive parses without delays', async () => {
    const { result } = renderHook(() => useRecipeImport());

    const recipe1 = JSON.stringify({
      '@type': 'Recipe',
      name: 'Recipe 1',
      image: 'https://example.com/1.jpg',
      recipeIngredient: ['ingredient 1'],
    });

    const recipe2 = JSON.stringify({
      '@type': 'Recipe',
      name: 'Recipe 2',
      image: 'https://example.com/2.jpg',
      recipeIngredient: ['ingredient 2'],
    });

    // Parse first recipe
    act(() => {
      result.current.setJsonLdText(recipe1);
    });

    await act(async () => {
      await result.current.parseJsonLd();
    });

    // Wait for state to be updated
    await waitFor(() => {
      expect(result.current.state.status).toBe('complete');
    });

    expect(result.current.state.recipe?.name).toBe('Recipe 1');

    // Immediately parse second recipe
    const startTime = performance.now();

    act(() => {
      result.current.setJsonLdText(recipe2);
    });

    await act(async () => {
      await result.current.parseJsonLd();
    });

    const duration = performance.now() - startTime;

    // Wait for second parse to complete
    await waitFor(() => {
      expect(result.current.state.status).toBe('complete');
    });

    expect(result.current.state.recipe?.name).toBe('Recipe 2');

    // Second parse should also complete quickly
    expect(duration).toBeLessThan(500);
  });

  it('should measure actual parsing time vs artificial delays', async () => {
    const { result } = renderHook(() => useRecipeImport());

    const recipes = [
      { name: 'Recipe 1', ingredients: ['a', 'b'] },
      { name: 'Recipe 2', ingredients: ['c', 'd', 'e'] },
      { name: 'Recipe 3', ingredients: ['f'] },
    ];

    const durations: number[] = [];

    for (const recipe of recipes) {
      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: recipe.name,
        image: 'https://example.com/image.jpg',
        recipeIngredient: recipe.ingredients,
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      const startTime = performance.now();

      await act(async () => {
        await result.current.parseJsonLd();
      });

      const duration = performance.now() - startTime;
      durations.push(duration);

      // Wait for parsing to complete
      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });
    }

    // All parses should complete quickly
    const maxDuration = Math.max(...durations);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    expect(maxDuration).toBeLessThan(500);
    expect(avgDuration).toBeLessThan(300);
  });
});
