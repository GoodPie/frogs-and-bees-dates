/**
 * Integration tests for RecipeImport with ingredient parsing
 */

import {describe, it, expect, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useRecipeImport} from '../hooks/useRecipeImport.ts';
import {act} from 'react';

describe('RecipeImport Integration - Hook Level', () => {
    it('should integrate ingredient parsing with recipe parsing', async () => {
        // Mock Firebase AI Logic for ingredient parsing
        const {getGenerativeModel} = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify([
                        {
                            quantity: "2",
                            unit: "cups",
                            ingredientName: "all-purpose flour",
                            preparationNotes: null,
                            metricQuantity: "240",
                            metricUnit: "g",
                            confidence: 0.95,
                        },
                        {
                            quantity: "1",
                            unit: "tsp",
                            ingredientName: "salt",
                            preparationNotes: null,
                            metricQuantity: "5",
                            metricUnit: "ml",
                            confidence: 1.0,
                        },
                    ]),
                },
            }),
        });

        const {result} = renderHook(() => useRecipeImport());

        // Prepare JSON-LD data
        const jsonLdData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: 'Test Recipe',
            image: 'https://example.com/image.jpg',
            recipeIngredient: [
                '2 cups all-purpose flour',
                '1 tsp salt',
            ],
            recipeInstructions: 'Mix ingredients',
        });

        // Set JSON-LD text
        act(() => {
            result.current.setJsonLdText(jsonLdData);
        });

        // Parse recipe
        await act(async () => {
            result.current.parseJsonLd();
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait for parsing
        });

        // Wait for both recipe and ingredient parsing to complete
        await waitFor(() => {
            expect(result.current.parseResult).not.toBeNull();
            expect(result.current.parsing).toBe(false);
            expect(result.current.isParsing).toBe(false);
        }, {timeout: 5000});

        // Verify recipe parsing succeeded
        expect(result.current.parseResult?.success).toBe(true);

        // Verify parsed recipe has ingredient data
        const recipe = result.current.getParsedRecipe();
        expect(recipe).not.toBeNull();
        expect(recipe?.parsedIngredients).toBeDefined();
        expect(recipe?.parsedIngredients).toHaveLength(2);

        // Verify metric conversions
        expect(recipe?.parsedIngredients?.[0].metricQuantity).toBe("240");
        expect(recipe?.parsedIngredients?.[0].metricUnit).toBe("g");
        expect(recipe?.parsedIngredients?.[0].ingredientName).toBe("all-purpose flour");

        expect(recipe?.parsedIngredients?.[1].metricQuantity).toBe("5");
        expect(recipe?.parsedIngredients?.[1].metricUnit).toBe("ml");
        expect(recipe?.parsedIngredients?.[1].ingredientName).toBe("salt");

        // Verify parsing completed flag is set
        expect(recipe?.ingredientParsingCompleted).toBe(true);
        expect(recipe?.ingredientParsingDate).toBeInstanceOf(Date);
    });

    it('should handle ingredient parsing failures gracefully', async () => {
        // Mock Firebase AI Logic to throw error
        const {getGenerativeModel} = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockRejectedValue(new Error('Network error')),
        });

        const {result} = renderHook(() => useRecipeImport());

        // Prepare JSON-LD data
        const jsonLdData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: 'Test Recipe',
            image: 'https://example.com/image.jpg',
            recipeIngredient: ['2 cups flour'],
            recipeInstructions: 'Bake',
        });

        // Set JSON-LD text
        act(() => {
            result.current.setJsonLdText(jsonLdData);
        });

        // Parse recipe
        await act(async () => {
            result.current.parseJsonLd();
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        // Wait for parsing to complete
        await waitFor(() => {
            expect(result.current.parsing).toBe(false);
        }, {timeout: 3000});

        // Recipe parsing should still succeed
        expect(result.current.parseResult?.success).toBe(true);

        // Should show warning about ingredient parsing failure
        expect(result.current.parseResult?.warnings).toContain(
            'Failed to parse ingredients. You can edit them manually.'
        );

        // Recipe should not have parsed ingredients
        const recipe = result.current.getParsedRecipe();
        expect(recipe?.parsedIngredients).toBeUndefined();
        expect(recipe?.ingredientParsingCompleted).toBeUndefined();
    });

    it('should set requiresManualReview flag for low-confidence ingredients', async () => {
        // Mock Firebase AI Logic with low-confidence parse
        const {getGenerativeModel} = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify([
                        {
                            quantity: null,
                            unit: null,
                            ingredientName: "salt to taste",
                            preparationNotes: null,
                            metricQuantity: null,
                            metricUnit: null,
                            confidence: 0.5,
                        },
                    ]),
                },
            }),
        });

        const {result} = renderHook(() => useRecipeImport());

        const jsonLdData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: 'Test Recipe',
            image: 'https://example.com/image.jpg',
            recipeIngredient: ['Salt to taste'],
            recipeInstructions: 'Add salt',
        });

        act(() => {
            result.current.setJsonLdText(jsonLdData);
        });

        await act(async () => {
            result.current.parseJsonLd();
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        await waitFor(() => {
            expect(result.current.isParsing).toBe(false);
        }, {timeout: 3000});

        const recipe = result.current.getParsedRecipe();
        expect(recipe?.parsedIngredients?.[0].requiresManualReview).toBe(true);
        expect(recipe?.parsedIngredients?.[0].confidence).toBe(0.5);
    });

    it('should preserve original ingredient text', async () => {
        const {getGenerativeModel} = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify([
                        {
                            quantity: "2",
                            unit: "cups",
                            ingredientName: "flour",
                            preparationNotes: null,
                            metricQuantity: "240",
                            metricUnit: "g",
                            confidence: 0.9,
                        },
                    ]),
                },
            }),
        });

        const {result} = renderHook(() => useRecipeImport());

        const originalIngredient = '2 cups all-purpose flour';
        const jsonLdData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: 'Test Recipe',
            image: 'https://example.com/image.jpg',
            recipeIngredient: [originalIngredient],
            recipeInstructions: 'Bake',
        });

        act(() => {
            result.current.setJsonLdText(jsonLdData);
        });

        await act(async () => {
            result.current.parseJsonLd();
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        await waitFor(() => {
            expect(result.current.isParsing).toBe(false);
        }, {timeout: 3000});

        const recipe = result.current.getParsedRecipe();
        expect(recipe?.parsedIngredients?.[0].originalText).toBe(originalIngredient);
    });

    it('should set isParsing state during ingredient parsing', async () => {
        const {getGenerativeModel} = (global as any).__firebaseMocks;
        let resolveGenerate: (value: any) => void;
        const generatePromise = new Promise((resolve) => {
            resolveGenerate = resolve;
        });

        getGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockReturnValue(generatePromise),
        });

        const {result} = renderHook(() => useRecipeImport());

        const jsonLdData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: 'Test Recipe',
            image: 'https://example.com/image.jpg',
            recipeIngredient: ['2 cups flour'],
            recipeInstructions: 'Bake',
        });

        act(() => {
            result.current.setJsonLdText(jsonLdData);
        });

        act(() => {
            result.current.parseJsonLd();
        });

        // Wait for isParsing to become true
        await waitFor(() => {
            expect(result.current.isParsing).toBe(true);
        }, {timeout: 1000});

        // Resolve the promise to complete parsing
        await act(async () => {
            resolveGenerate({
                response: {
                    text: () => JSON.stringify([]),
                },
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        // isParsing should go back to false
        expect(result.current.isParsing).toBe(false);
    });
});
