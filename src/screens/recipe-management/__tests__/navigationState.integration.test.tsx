/**
 * Integration tests for navigation state passing between RecipeImport and AddRecipe
 * Tests the useRecipeImport hook's importRecipe function and navigation flow
 * @module __tests__/navigationState.integration.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecipeImport } from '../hooks/useRecipeImport';
import { MemoryRouter } from 'react-router-dom';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation State Passing: RecipeImport -> AddRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importRecipe function', () => {
    it('should navigate to RECIPE_ADD route with imported recipe in state', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['2 cups flour'],
        recipeInstructions: ['Mix and bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // Verify navigation was called
      expect(mockNavigate).toHaveBeenCalledWith(
        '/recipes/new',
        expect.objectContaining({
          state: expect.objectContaining({
            importedRecipe: expect.objectContaining({
              name: 'Test Recipe',
              image: 'https://example.com/img.jpg',
            }),
          }),
        })
      );
    });

    it('should pass parsedIngredients in navigation state', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Recipe with Ingredients',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix and bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // Verify parsedIngredients were passed
      expect(mockNavigate).toHaveBeenCalledWith(
        '/recipes/new',
        expect.objectContaining({
          state: expect.objectContaining({
            importedRecipe: expect.objectContaining({
              parsedIngredients: expect.any(Array),
              ingredientParsingCompleted: true,
            }),
          }),
        })
      );
    });

    it('should pass complete recipe metadata in navigation state', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Complete Recipe',
        description: 'A complete recipe',
        image: 'https://example.com/complete.jpg',
        recipeYield: '8 servings',
        prepTime: 'PT15M',
        cookTime: 'PT30M',
        recipeCategory: ['Dessert'],
        recipeCuisine: ['American'],
        keywords: 'easy,homemade',
        recipeIngredient: ['flour', 'sugar'],
        recipeInstructions: ['Mix', 'Bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // Verify all metadata was passed
      const navCall = mockNavigate.mock.calls[0];
      const importedRecipe = navCall[1].state.importedRecipe;

      expect(importedRecipe.name).toBe('Complete Recipe');
      expect(importedRecipe.description).toBe('A complete recipe');
      expect(importedRecipe.recipeYield).toBe('8 servings');
      expect(importedRecipe.prepTime).toBe('PT15M');
      expect(importedRecipe.cookTime).toBe('PT30M');
      expect(importedRecipe.recipeCategory).toContain('Dessert');
      expect(importedRecipe.recipeCuisine).toContain('American');
    });

    it('should not navigate if parsing status is not complete', () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      // Try to import without parsing
      act(() => {
        result.current.importRecipe();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate if recipe data is missing', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      // Set state to complete but without recipe data
      // This should not be possible in normal flow, but testing defensive code
      act(() => {
        result.current.setJsonLdText('');
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      // Should be in error state, not complete
      expect(result.current.state.status).not.toBe('complete');

      act(() => {
        result.current.importRecipe();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should reset state after successful import', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['flour'],
        recipeInstructions: ['bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // State should be reset to idle after import
      expect(result.current.state.status).toBe('idle');
      expect(result.current.jsonLdText).toBe('');
      expect(result.current.url).toBe('');
    });
  });

  describe('canImport computed property', () => {
    it('should be true when recipe has name and image', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Valid Recipe',
        image: 'https://example.com/valid.jpg',
        recipeIngredient: ['flour'],
        recipeInstructions: ['bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      expect(result.current.canImport).toBe(true);
    });

    it('should be false when recipe is missing name', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        // Missing name
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['flour'],
        recipeInstructions: ['bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).not.toBe('complete');
      });

      expect(result.current.canImport).toBe(false);
    });

    it('should be false when recipe is missing image', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Recipe Without Image',
        // Missing image
        recipeIngredient: ['flour'],
        recipeInstructions: ['bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).not.toBe('complete');
      });

      expect(result.current.canImport).toBe(false);
    });

    it('should be false when parsing status is not complete', () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      expect(result.current.canImport).toBe(false);
    });
  });

  describe('Parsed ingredient metadata', () => {
    it('should include ingredient parsing metadata in navigation state', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Recipe with Metadata',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix and bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // Verify metadata fields
      const navCall = mockNavigate.mock.calls[0];
      const importedRecipe = navCall[1].state.importedRecipe;

      expect(importedRecipe.ingredientParsingCompleted).toBe(true);
      expect(importedRecipe.ingredientParsingDate).toBeDefined();
      expect(importedRecipe.parsedIngredients).toBeDefined();
      expect(importedRecipe.parsedIngredients.length).toBeGreaterThan(0);
    });

    it('should include confidence and requiresManualReview flags in parsedIngredients', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Recipe with Parsed Ingredients',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['2 cups flour'],
        recipeInstructions: ['Mix and bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete');
      });

      // Call importRecipe
      act(() => {
        result.current.importRecipe();
      });

      // Verify parsed ingredient structure
      const navCall = mockNavigate.mock.calls[0];
      const importedRecipe = navCall[1].state.importedRecipe;
      const firstIngredient = importedRecipe.parsedIngredients[0];

      expect(firstIngredient).toHaveProperty('confidence');
      expect(firstIngredient).toHaveProperty('requiresManualReview');
      expect(firstIngredient).toHaveProperty('parsingMethod');
      expect(firstIngredient).toHaveProperty('originalText');
    });
  });

  describe('Error handling', () => {
    it('should not navigate when import is called during parsing', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      const jsonLd = JSON.stringify({
        '@type': 'Recipe',
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        recipeIngredient: ['flour'],
        recipeInstructions: ['bake'],
      });

      act(() => {
        result.current.setJsonLdText(jsonLd);
      });

      // Start parsing but don't wait
      act(() => {
        result.current.parseJsonLd();
      });

      // Try to import while parsing
      act(() => {
        result.current.importRecipe();
      });

      // Should not navigate while parsing
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate after parsing error', async () => {
      const { result } = renderHook(() => useRecipeImport(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      });

      // Invalid JSON
      act(() => {
        result.current.setJsonLdText('{invalid}');
      });

      await act(async () => {
        await result.current.parseJsonLd();
      });

      // Should be in error state
      expect(result.current.state.status).toBe('error');

      // Try to import
      act(() => {
        result.current.importRecipe();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
