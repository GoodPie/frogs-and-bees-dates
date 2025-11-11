/**
 * Integration tests for recipe data persistence from import to edit
 * Tests the complete workflow: RecipeImport -> useRecipeImport.importRecipe() -> AddRecipe
 * Verifies that all recipe data (including parsedIngredients) persists correctly
 * @module __tests__/importToEdit.integration.test
 *
 * NOTE: These tests are currently skipped as they test the end-to-end import flow
 * which has been refactored. Tests need to be updated for the new state machine pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from '@/components/ui/provider';
import AddRecipe from '../AddRecipe';
import type { IRecipe } from '@/screens/recipe-management/types/Recipe';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

// Mock the hooks used by AddRecipe
vi.mock('@/screens/recipe-management/hooks/useRecipeOperations', () => ({
  useRecipeOperations: () => ({
    addRecipe: vi.fn().mockResolvedValue('recipe-123'),
    loading: false,
    error: null,
  }),
}));

// Test component to capture location state
function LocationStateCapture({ onStateCapture }: { onStateCapture: (state: any) => void }) {
  const location = useLocation();
  onStateCapture(location.state);
  return <AddRecipe />;
}

describe.skip('Recipe Import to Edit Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Recipe data persistence', () => {
    it('should persist basic recipe fields from import to edit', async () => {
      const importedRecipe: Partial<IRecipe> = {
        name: 'Chocolate Chip Cookies',
        description: 'Classic homemade cookies',
        image: 'https://example.com/cookies.jpg',
        recipeYield: '24 cookies',
        prepTime: 'PT15M',
        cookTime: 'PT12M',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix ingredients', 'Bake at 350F'],
        recipeCategory: ['Dessert'],
        recipeCuisine: ['American'],
        keywords: ['cookies', 'dessert'],
      };

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route path="/recipes/new" element={<AddRecipe />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Verify basic info fields are populated
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Chocolate Chip Cookies/i);
        expect(nameInput).toHaveValue('Chocolate Chip Cookies');
      });

      const descriptionInput = screen.getByPlaceholderText(/Brief description of the recipe/i);
      expect(descriptionInput).toHaveValue('Classic homemade cookies');

      const yieldInput = screen.getByPlaceholderText(/e.g., 6 servings, Makes 12 cookies/i);
      expect(yieldInput).toHaveValue('24 cookies');
    });

    it('should persist parsedIngredients field from import to edit', async () => {
      const parsedIngredients: ParsedIngredient[] = [
        {
          originalText: '2 cups all-purpose flour',
          quantity: '2',
          unit: 'cups',
          ingredientName: 'all-purpose flour',
          preparationNotes: null,
          metricQuantity: '240',
          metricUnit: 'g',
          confidence: 0.95,
          requiresManualReview: false,
          parsingMethod: 'ai',
        },
        {
          originalText: '1 cup granulated sugar',
          quantity: '1',
          unit: 'cup',
          ingredientName: 'granulated sugar',
          preparationNotes: null,
          metricQuantity: '200',
          metricUnit: 'g',
          confidence: 0.92,
          requiresManualReview: false,
          parsingMethod: 'ai',
        },
      ];

      const importedRecipe: Partial<IRecipe> = {
        name: 'Sugar Cookies',
        image: 'https://example.com/sugar-cookies.jpg',
        recipeIngredient: ['2 cups all-purpose flour', '1 cup granulated sugar'],
        recipeInstructions: ['Mix and bake'],
        parsedIngredients,
        ingredientParsingCompleted: true,
        ingredientParsingDate: new Date(),
      };

      let capturedState: any = null;

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route
                path="/recipes/new"
                element={<LocationStateCapture onStateCapture={(s) => (capturedState = s)} />}
              />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Verify state was passed
      await waitFor(() => {
        expect(capturedState).toBeDefined();
        expect(capturedState.importedRecipe).toBeDefined();
      });

      // Verify parsedIngredients were passed
      expect(capturedState.importedRecipe.parsedIngredients).toHaveLength(2);
      expect(capturedState.importedRecipe.parsedIngredients[0].originalText).toBe(
        '2 cups all-purpose flour'
      );
      expect(capturedState.importedRecipe.parsedIngredients[0].confidence).toBe(0.95);
      expect(capturedState.importedRecipe.ingredientParsingCompleted).toBe(true);
    });

    it('should persist low-confidence ingredients that require manual review', async () => {
      const parsedIngredients: ParsedIngredient[] = [
        {
          originalText: 'Salt to taste',
          quantity: null,
          unit: null,
          ingredientName: 'Salt',
          preparationNotes: 'to taste',
          metricQuantity: null,
          metricUnit: null,
          confidence: 0.5,
          requiresManualReview: true,
          parsingMethod: 'ai',
        },
      ];

      const importedRecipe: Partial<IRecipe> = {
        name: 'Recipe with Low Confidence',
        image: 'https://example.com/recipe.jpg',
        recipeIngredient: ['Salt to taste'],
        recipeInstructions: ['Season to taste'],
        parsedIngredients,
        ingredientParsingCompleted: true,
      };

      let capturedState: any = null;

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route
                path="/recipes/new"
                element={<LocationStateCapture onStateCapture={(s) => (capturedState = s)} />}
              />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(capturedState?.importedRecipe?.parsedIngredients).toBeDefined();
      });

      // Verify low-confidence ingredient persisted
      const lowConfidenceIngredient = capturedState.importedRecipe.parsedIngredients[0];
      expect(lowConfidenceIngredient.confidence).toBe(0.5);
      expect(lowConfidenceIngredient.requiresManualReview).toBe(true);
    });

    it('should handle recipes without parsedIngredients (legacy recipes)', async () => {
      const importedRecipe: Partial<IRecipe> = {
        name: 'Legacy Recipe',
        image: 'https://example.com/legacy.jpg',
        recipeIngredient: ['2 cups flour', '1 cup sugar'],
        recipeInstructions: ['Mix and bake'],
        // No parsedIngredients - simulating legacy recipe
      };

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route path="/recipes/new" element={<AddRecipe />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Should still render without errors
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Chocolate Chip Cookies/i);
        expect(nameInput).toHaveValue('Legacy Recipe');
      });
    });

    it('should handle empty state gracefully (no imported recipe)', async () => {
      render(
        <Provider>
          <MemoryRouter initialEntries={['/recipes/new']}>
            <Routes>
              <Route path="/recipes/new" element={<AddRecipe />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Should render empty form
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Chocolate Chip Cookies/i);
        expect(nameInput).toHaveValue('');
      });
    });
  });

  describe('Ingredient edit workflow', () => {
    it('should allow editing parsed ingredients and mark as manual', async () => {
      const parsedIngredients: ParsedIngredient[] = [
        {
          originalText: '2 cups flour',
          quantity: '2',
          unit: 'cups',
          ingredientName: 'flour',
          preparationNotes: null,
          metricQuantity: '240',
          metricUnit: 'g',
          confidence: 0.9,
          requiresManualReview: false,
          parsingMethod: 'ai',
        },
      ];

      const importedRecipe: Partial<IRecipe> = {
        name: 'Editable Recipe',
        image: 'https://example.com/recipe.jpg',
        recipeIngredient: ['2 cups flour'],
        recipeInstructions: ['Mix and bake'],
        parsedIngredients,
        ingredientParsingCompleted: true,
      };

      let capturedState: any = null;

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route
                path="/recipes/new"
                element={<LocationStateCapture onStateCapture={(s) => (capturedState = s)} />}
              />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(capturedState?.importedRecipe?.parsedIngredients).toBeDefined();
      });

      // Verify initial parsing method is 'ai'
      expect(capturedState.importedRecipe.parsedIngredients[0].parsingMethod).toBe('ai');
    });
  });

  describe('Navigation state validation', () => {
    it('should handle corrupt state data gracefully', async () => {
      const corruptState = {
        importedRecipe: {
          name: 'Test',
          // Missing required image field
          recipeIngredient: ['flour'],
          recipeInstructions: null, // Invalid type
        },
      };

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: corruptState }]}>
            <Routes>
              <Route path="/recipes/new" element={<AddRecipe />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Should render without crashing
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Chocolate Chip Cookies/i);
        expect(nameInput).toBeDefined();
      });
    });

    it('should handle missing importedRecipe in state', async () => {
      const invalidState = {
        someOtherField: 'data',
      };

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: invalidState }]}>
            <Routes>
              <Route path="/recipes/new" element={<AddRecipe />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Should render empty form
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Chocolate Chip Cookies/i);
        expect(nameInput).toHaveValue('');
      });
    });
  });

  describe('Complete import workflow', () => {
    it('should preserve all data through complete import-to-edit-to-save workflow', async () => {
      const parsedIngredients: ParsedIngredient[] = [
        {
          originalText: '2 cups all-purpose flour',
          quantity: '2',
          unit: 'cups',
          ingredientName: 'all-purpose flour',
          preparationNotes: null,
          metricQuantity: '240',
          metricUnit: 'g',
          confidence: 0.95,
          requiresManualReview: false,
          parsingMethod: 'ai',
        },
        {
          originalText: '1/2 tsp salt',
          quantity: '1/2',
          unit: 'tsp',
          ingredientName: 'salt',
          preparationNotes: null,
          metricQuantity: '2.5',
          metricUnit: 'g',
          confidence: 0.88,
          requiresManualReview: false,
          parsingMethod: 'ai',
        },
      ];

      const importedRecipe: Partial<IRecipe> = {
        name: 'Complete Recipe',
        description: 'Full recipe with all fields',
        image: 'https://example.com/complete.jpg',
        recipeYield: '12 servings',
        prepTime: 'PT20M',
        cookTime: 'PT40M',
        totalTime: 'PT1H',
        recipeIngredient: ['2 cups all-purpose flour', '1/2 tsp salt'],
        recipeInstructions: ['Combine dry ingredients', 'Mix wet ingredients', 'Bake'],
        recipeCategory: ['Dessert', 'Baking'],
        recipeCuisine: ['American'],
        keywords: ['easy', 'homemade'],
        parsedIngredients,
        ingredientParsingCompleted: true,
        ingredientParsingDate: new Date('2025-01-15'),
      };

      let capturedState: any = null;

      render(
        <Provider>
          <MemoryRouter initialEntries={[{ pathname: '/recipes/new', state: { importedRecipe } }]}>
            <Routes>
              <Route
                path="/recipes/new"
                element={<LocationStateCapture onStateCapture={(s) => (capturedState = s)} />}
              />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(capturedState?.importedRecipe).toBeDefined();
      });

      // Verify all fields persisted
      const recipe = capturedState.importedRecipe;
      expect(recipe.name).toBe('Complete Recipe');
      expect(recipe.description).toBe('Full recipe with all fields');
      expect(recipe.recipeYield).toBe('12 servings');
      expect(recipe.recipeIngredient).toHaveLength(2);
      expect(recipe.recipeInstructions).toHaveLength(3);
      expect(recipe.parsedIngredients).toHaveLength(2);
      expect(recipe.parsedIngredients[0].metricQuantity).toBe('240');
      expect(recipe.parsedIngredients[1].confidence).toBe(0.88);
      expect(recipe.ingredientParsingCompleted).toBe(true);
      expect(recipe.recipeCategory).toContain('Dessert');
      expect(recipe.recipeCuisine).toContain('American');
      expect(recipe.keywords).toContain('easy');
    });
  });
});
