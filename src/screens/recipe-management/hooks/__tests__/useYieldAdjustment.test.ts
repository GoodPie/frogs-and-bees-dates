import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYieldAdjustment } from '../useYieldAdjustment';
import type { IRecipe } from '@/screens/recipe-management/types/Recipe';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

const createMockRecipe = (overrides?: Partial<IRecipe>): IRecipe => ({
    name: 'Test Recipe',
    image: 'test.jpg',
    recipeIngredient: ['2 cups flour', '1 cup sugar'],
    recipeInstructions: ['Mix ingredients'],
    recipeYield: '4 servings',
    parsedIngredients: [
        { name: 'flour', quantity: 2, unit: 'cups' } as ParsedIngredient,
        { name: 'sugar', quantity: 1, unit: 'cup' } as ParsedIngredient,
    ],
    ...overrides,
});

describe('useYieldAdjustment', () => {
    describe('initialization', () => {
        it('should initialize with numeric yield', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            expect(result.current.yieldState.originalYield).toBe(4);
            expect(result.current.yieldState.currentYield).toBe(4);
            expect(result.current.yieldState.yieldMultiplier).toBe(1.0);
            expect(result.current.yieldState.isAdjusted).toBe(false);
        });

        it('should initialize with string yield', () => {
            const recipe = createMockRecipe({ recipeYield: '4 servings' });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            expect(result.current.yieldState.originalYield).toBe(4);
            expect(result.current.yieldState.currentYield).toBe(4);
            expect(result.current.yieldState.originalYieldString).toBe('4 servings');
        });

        it('should initialize with undefined yield (default to 1)', () => {
            const recipe = createMockRecipe({ recipeYield: undefined });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            expect(result.current.yieldState.originalYield).toBe(1);
            expect(result.current.yieldState.currentYield).toBe(1);
        });

        it('should initialize with range yield (use midpoint)', () => {
            const recipe = createMockRecipe({ recipeYield: '6-8 servings' });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            expect(result.current.yieldState.originalYield).toBe(7);
            expect(result.current.yieldState.currentYield).toBe(7);
        });
    });

    describe('increment', () => {
        it('should increment yield by 1', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.increment();
            });

            expect(result.current.yieldState.currentYield).toBe(5);
            expect(result.current.yieldState.yieldMultiplier).toBe(1.25);
            expect(result.current.yieldState.isAdjusted).toBe(true);
        });

        it('should not increment beyond maximum', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Set to maximum (4 * 10 = 40)
            act(() => {
                result.current.adjustYield(40);
            });

            // Try to increment
            act(() => {
                result.current.increment();
            });

            expect(result.current.yieldState.currentYield).toBe(40);
        });
    });

    describe('decrement', () => {
        it('should decrement yield by 1', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.decrement();
            });

            expect(result.current.yieldState.currentYield).toBe(3);
            expect(result.current.yieldState.yieldMultiplier).toBe(0.75);
            expect(result.current.yieldState.isAdjusted).toBe(true);
        });

        it('should not decrement below minimum', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Set to minimum (4 * 0.5 = 2)
            act(() => {
                result.current.adjustYield(2);
            });

            // Try to decrement
            act(() => {
                result.current.decrement();
            });

            expect(result.current.yieldState.currentYield).toBe(2);
        });
    });

    describe('adjustYield', () => {
        it('should adjust to valid value', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(6);
            });

            expect(result.current.yieldState.currentYield).toBe(6);
            expect(result.current.yieldState.yieldMultiplier).toBe(1.5);
            expect(result.current.yieldState.isAdjusted).toBe(true);
            expect(result.current.error).toBeNull();
        });

        it('should reject value below minimum', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(1);
            });

            expect(result.current.yieldState.currentYield).toBe(4); // Unchanged
            expect(result.current.error).not.toBeNull();
            expect(result.current.error?.type).toBe('below_minimum');
        });

        it('should reject value above maximum', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(50);
            });

            expect(result.current.yieldState.currentYield).toBe(4); // Unchanged
            expect(result.current.error).not.toBeNull();
            expect(result.current.error?.type).toBe('above_maximum');
        });

        it('should reject NaN value', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(NaN);
            });

            expect(result.current.yieldState.currentYield).toBe(4); // Unchanged
            expect(result.current.error).not.toBeNull();
            expect(result.current.error?.type).toBe('invalid_number');
        });

        it('should clear error on valid adjustment after error', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // First, set an invalid value
            act(() => {
                result.current.adjustYield(50);
            });
            expect(result.current.error).not.toBeNull();

            // Then, set a valid value
            act(() => {
                result.current.adjustYield(6);
            });
            expect(result.current.error).toBeNull();
        });
    });

    describe('reset', () => {
        it('should reset to original yield', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Adjust yield
            act(() => {
                result.current.adjustYield(8);
            });
            expect(result.current.yieldState.isAdjusted).toBe(true);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.yieldState.currentYield).toBe(4);
            expect(result.current.yieldState.yieldMultiplier).toBe(1.0);
            expect(result.current.yieldState.isAdjusted).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should clear error on reset', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Set invalid value to create error
            act(() => {
                result.current.adjustYield(50);
            });
            expect(result.current.error).not.toBeNull();

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('scaledIngredients', () => {
        it('should scale ingredients proportionally', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(6);
            });

            const scaled = result.current.scaledIngredients;
            expect(scaled).toBeDefined();
            expect(scaled?.[0].scaledQuantity).toBe(3.0); // 2 * 1.5
            expect(scaled?.[1].scaledQuantity).toBe(1.5); // 1 * 1.5
        });

        it('should handle null quantities', () => {
            const recipe = createMockRecipe({
                recipeYield: 4,
                parsedIngredients: [
                    { name: 'salt to taste', quantity: null, unit: null } as ParsedIngredient,
                ],
            });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            act(() => {
                result.current.adjustYield(6);
            });

            const scaled = result.current.scaledIngredients;
            expect(scaled?.[0].scaledQuantity).toBeNull();
            expect(scaled?.[0].wasScaled).toBe(false);
        });

        it('should set wasScaled flag correctly', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Initially not scaled
            expect(result.current.scaledIngredients?.[0].wasScaled).toBe(false);

            // After adjustment
            act(() => {
                result.current.adjustYield(6);
            });
            expect(result.current.scaledIngredients?.[0].wasScaled).toBe(true);
        });

        it('should return undefined if recipe has no parsedIngredients', () => {
            const recipe = createMockRecipe({ parsedIngredients: undefined });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            expect(result.current.scaledIngredients).toBeUndefined();
        });

        it('should add warning for very small quantities', () => {
            const recipe = createMockRecipe({
                recipeYield: 4,
                parsedIngredients: [
                    { name: 'spice', quantity: 0.2, unit: 'tsp' } as ParsedIngredient,
                ],
            });
            const { result } = renderHook(() => useYieldAdjustment(recipe));

            // Scale down to make quantity very small
            act(() => {
                result.current.adjustYield(2); // 0.2 * 0.5 = 0.1, but 0.2 * (2/4) = 0.1
            });

            const scaled = result.current.scaledIngredients;
            // 0.2 * 0.5 = 0.1, which is NOT less than 0.1, so no warning
            // Let's scale down more
            act(() => {
                result.current.adjustYield(1); // But minimum is 2 (4 * 0.5)
            });

            // We can't get below 2, so let's try a different approach
            // Use a smaller original quantity
            const recipe2 = createMockRecipe({
                recipeYield: 10,
                parsedIngredients: [
                    { name: 'spice', quantity: 0.5, unit: 'tsp' } as ParsedIngredient,
                ],
            });
            const { result: result2 } = renderHook(() => useYieldAdjustment(recipe2));

            act(() => {
                result2.current.adjustYield(5); // 0.5 * 0.5 = 0.25, still not < 0.1
            });

            // Let's use an even smaller quantity
            const recipe3 = createMockRecipe({
                recipeYield: 10,
                parsedIngredients: [
                    { name: 'spice', quantity: 0.15, unit: 'tsp' } as ParsedIngredient,
                ],
            });
            const { result: result3 } = renderHook(() => useYieldAdjustment(recipe3));

            act(() => {
                result3.current.adjustYield(5); // 0.15 * 0.5 = 0.075, which is < 0.1
            });

            expect(result3.current.scaledIngredients?.[0].warning).toBe('Very small amount');
        });

        it('should memoize and only recalculate when dependencies change', () => {
            const recipe = createMockRecipe({ recipeYield: 4 });
            const { result, rerender } = renderHook(() => useYieldAdjustment(recipe));

            const firstScaled = result.current.scaledIngredients;

            // Rerender without changing anything
            rerender();

            const secondScaled = result.current.scaledIngredients;

            // Should be the same reference (memoized)
            expect(firstScaled).toBe(secondScaled);

            // Now adjust yield
            act(() => {
                result.current.adjustYield(6);
            });

            const thirdScaled = result.current.scaledIngredients;

            // Should be a different reference (recalculated)
            expect(thirdScaled).not.toBe(firstScaled);
        });
    });
});
