/**
 * Integration tests for Recipe Firestore persistence with parsedIngredients
 */

import {describe, it, expect, beforeEach, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useRecipeOperations} from '../hooks/useRecipeOperations.ts';
import {useRecipes} from '../hooks/useRecipes.ts';
import type {IRecipe, ParsedIngredient} from '../types/Recipe.ts';
import {act} from 'react';

describe.skip('Recipe Firestore Integration - parsedIngredients', () => {
    const mockParsedIngredients: ParsedIngredient[] = [
        {
            originalText: '2 cups all-purpose flour',
            quantity: 2,
            unit: 'cup',
            ingredientName: 'all-purpose flour',
            preparationNotes: null,
            metricQuantity: 240,
            metricUnit: 'g',
            confidence: 0.95,
            parsingMethod: 'ai',
            requiresManualReview: false,
        },
        {
            originalText: '1/2 tsp salt',
            quantity: 0.5,
            unit: 'tsp',
            ingredientName: 'salt',
            preparationNotes: null,
            metricQuantity: 2.5,
            metricUnit: 'ml',
            confidence: 1.0,
            parsingMethod: 'ai',
            requiresManualReview: false,
        },
    ];

    const mockRecipe: Partial<IRecipe> = {
        name: 'Test Recipe',
        image: 'https://example.com/image.jpg',
        imageSource: 'url',
        recipeIngredient: ['2 cups all-purpose flour', '1/2 tsp salt'],
        recipeInstructions: ['Mix ingredients', 'Bake'],
        parsedIngredients: mockParsedIngredients,
        ingredientParsingCompleted: true,
        ingredientParsingDate: new Date('2025-11-09'),
    };

    beforeEach(() => {
        // Reset all Firebase mocks before each test
        vi.clearAllMocks();
    });

    it('should save recipe with parsedIngredients to Firestore', async () => {
        const {addDoc} = (global as any).__firebaseMocks;
        addDoc.mockResolvedValue({id: 'test-recipe-id'});

        const {result} = renderHook(() => useRecipeOperations());

        let recipeId: string | null = null;

        await act(async () => {
            recipeId = await result.current.addRecipe(mockRecipe);
        });

        // Verify addDoc was called
        expect(addDoc).toHaveBeenCalled();

        // Verify recipe ID was returned
        expect(recipeId).toBe('test-recipe-id');

        // Verify addDoc was called with parsedIngredients
        const callArgs = addDoc.mock.calls[0];
        const savedData = callArgs[1];

        expect(savedData.parsedIngredients).toBeDefined();
        expect(savedData.parsedIngredients).toHaveLength(2);
        expect(savedData.ingredientParsingCompleted).toBe(true);
        expect(savedData.ingredientParsingDate).toBeDefined();
    });

    it('should update recipe with parsedIngredients in Firestore', async () => {
        const {updateDoc} = (global as any).__firebaseMocks;
        updateDoc.mockResolvedValue(undefined);

        const {result} = renderHook(() => useRecipeOperations());

        const updatedRecipe: Partial<IRecipe> = {
            ...mockRecipe,
            parsedIngredients: [
                ...mockParsedIngredients,
                {
                    originalText: '1 tsp vanilla extract',
                    quantity: 1,
                    unit: 'tsp',
                    ingredientName: 'vanilla extract',
                    preparationNotes: null,
                    metricQuantity: 5,
                    metricUnit: 'ml',
                    confidence: 1.0,
                    parsingMethod: 'manual',
                    requiresManualReview: false,
                },
            ],
        };

        let success = false;

        await act(async () => {
            success = await result.current.updateRecipe('test-recipe-id', updatedRecipe);
        });

        // Verify updateDoc was called
        expect(updateDoc).toHaveBeenCalled();
        expect(success).toBe(true);

        // Verify parsedIngredients were included in update
        const callArgs = updateDoc.mock.calls[0];
        const updatedData = callArgs[1];

        expect(updatedData.parsedIngredients).toBeDefined();
        expect(updatedData.parsedIngredients).toHaveLength(3);
    });

    it('should load recipe with parsedIngredients from Firestore', async () => {
        const {getDocs} = (global as any).__firebaseMocks;

        // Mock Firestore document with parsedIngredients
        getDocs.mockResolvedValue({
            docs: [
                {
                    id: 'test-recipe-id',
                    data: () => ({
                        name: 'Test Recipe',
                        image: 'https://example.com/image.jpg',
                        imageSource: 'url',
                        recipeIngredient: ['2 cups all-purpose flour', '1/2 tsp salt'],
                        recipeInstructions: ['Mix', 'Bake'],
                        parsedIngredients: mockParsedIngredients,
                        ingredientParsingCompleted: true,
                        ingredientParsingDate: {
                            toDate: () => new Date('2025-11-09'),
                        },
                        createdAt: {
                            toDate: () => new Date('2025-11-09'),
                        },
                    }),
                },
            ],
            forEach: (callback: (doc: any) => void) => {
                const docs = getDocs.mock.results[0].value.docs;
                docs.forEach(callback);
            },
        });

        const {result} = renderHook(() => useRecipes());

        // Wait for recipes to load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, {timeout: 3000});

        // Verify recipe was loaded
        expect(result.current.recipes).toHaveLength(1);

        const loadedRecipe = result.current.recipes[0];

        // Verify parsedIngredients were loaded
        expect(loadedRecipe.parsedIngredients).toBeDefined();
        expect(loadedRecipe.parsedIngredients).toHaveLength(2);

        // Verify first parsed ingredient
        expect(loadedRecipe.parsedIngredients?.[0].originalText).toBe('2 cups all-purpose flour');
        expect(loadedRecipe.parsedIngredients?.[0].quantity).toBe(2);
        expect(loadedRecipe.parsedIngredients?.[0].metricQuantity).toBe(240);
        expect(loadedRecipe.parsedIngredients?.[0].metricUnit).toBe('g');

        // Verify metadata was deserialized
        expect(loadedRecipe.ingredientParsingCompleted).toBe(true);
        expect(loadedRecipe.ingredientParsingDate).toBeInstanceOf(Date);
    });

    it('should validate parsedIngredients length matches recipeIngredient length', async () => {
        const {addDoc} = (global as any).__firebaseMocks;

        const invalidRecipe: Partial<IRecipe> = {
            ...mockRecipe,
            recipeIngredient: ['2 cups flour', '1 tsp salt', '1 egg'], // 3 ingredients
            parsedIngredients: mockParsedIngredients, // Only 2 parsed ingredients
        };

        const {result} = renderHook(() => useRecipeOperations());

        let recipeId: string | null = null;

        await act(async () => {
            recipeId = await result.current.addRecipe(invalidRecipe);
        });

        // Should fail validation
        expect(recipeId).toBeNull();
        expect(result.current.error).toContain('Parsed ingredients count must match recipe ingredients count');
        expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle recipes without parsedIngredients (backward compatibility)', async () => {
        const {getDocs} = (global as any).__firebaseMocks;

        // Mock recipe without parsedIngredients (old format)
        getDocs.mockResolvedValue({
            docs: [
                {
                    id: 'old-recipe-id',
                    data: () => ({
                        name: 'Old Recipe',
                        image: 'https://example.com/image.jpg',
                        imageSource: 'url',
                        recipeIngredient: ['2 cups flour'],
                        recipeInstructions: ['Bake'],
                        // No parsedIngredients field
                        createdAt: {
                            toDate: () => new Date('2024-01-01'),
                        },
                    }),
                },
            ],
            forEach: (callback: (doc: any) => void) => {
                const docs = getDocs.mock.results[0].value.docs;
                docs.forEach(callback);
            },
        });

        const {result} = renderHook(() => useRecipes());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, {timeout: 3000});

        // Recipe should load successfully
        expect(result.current.recipes).toHaveLength(1);

        const loadedRecipe = result.current.recipes[0];

        // parsedIngredients should be undefined (not an error)
        expect(loadedRecipe.parsedIngredients).toBeUndefined();
        expect(loadedRecipe.ingredientParsingCompleted).toBeUndefined();

        // Original ingredients should still be available
        expect(loadedRecipe.recipeIngredient).toEqual(['2 cups flour']);
    });

    it('should preserve parsingMethod and confidence when saving', async () => {
        const {addDoc} = (global as any).__firebaseMocks;
        addDoc.mockResolvedValue({id: 'test-recipe-id'});

        const recipeWithManualEdit: Partial<IRecipe> = {
            ...mockRecipe,
            parsedIngredients: [
                {
                    ...mockParsedIngredients[0],
                    parsingMethod: 'manual',
                    confidence: 1.0,
                    quantity: 2.5, // User manually edited
                },
                mockParsedIngredients[1],
            ],
        };

        const {result} = renderHook(() => useRecipeOperations());

        await act(async () => {
            await result.current.addRecipe(recipeWithManualEdit);
        });

        const savedData = addDoc.mock.calls[0][1];

        // Verify manual edits were preserved
        expect(savedData.parsedIngredients[0].parsingMethod).toBe('manual');
        expect(savedData.parsedIngredients[0].confidence).toBe(1.0);
        expect(savedData.parsedIngredients[0].quantity).toBe(2.5);
    });
});
