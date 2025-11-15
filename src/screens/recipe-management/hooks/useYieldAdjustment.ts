import {useState, useMemo, useCallback} from 'react';
import type {
    IRecipe,
    YieldAdjustmentState,
    ScaledIngredient,
    YieldValidationError
} from '@/screens/recipe-management/types/Recipe';
import {
    parseYield,
    scaleQuantity,
    validateYield,
    calculateMultiplier
} from '@/screens/recipe-management/utils/yieldCalculations';
import {decimalToFraction} from '@/screens/recipe-management/utils/fractionFormatter';
import {fractionToDecimal} from "@/services/ingredientParser.ts";

export interface UseYieldAdjustmentReturn {
    /** Current yield adjustment state */
    yieldState: YieldAdjustmentState;

    /** Ingredients with scaled quantities */
    scaledIngredients: ScaledIngredient[] | undefined;

    /** Adjust yield to specific value */
    adjustYield: (newYield: number) => void;

    /** Increment yield by 1 */
    increment: () => void;

    /** Decrement yield by 1 */
    decrement: () => void;

    /** Reset to original yield */
    reset: () => void;

    /** Current validation error (if any) */
    error: YieldValidationError | null;
}

export function useYieldAdjustment(recipe: IRecipe): UseYieldAdjustmentReturn {
    // Initialize state from recipe
    const [state, setState] = useState<YieldAdjustmentState>(() => {
        const originalYield = parseYield(recipe.recipeYield);
        return {
            originalYield,
            currentYield: originalYield,
            yieldMultiplier: 1.0,
            isAdjusted: false,
            originalYieldString: recipe.recipeYield?.toString(),
        };
    });

    const [error, setError] = useState<YieldValidationError | null>(null);

    // Adjust yield to specific value
    const adjustYield = useCallback((newYield: number) => {
        const validationError = validateYield(newYield, state.originalYield);

        if (validationError) {
            setError(validationError);
            return;
        }

        // Clear error and update state
        setError(null);
        setState({
            ...state,
            currentYield: newYield,
            yieldMultiplier: calculateMultiplier(newYield, state.originalYield),
            isAdjusted: newYield !== state.originalYield,
        });
    }, [state]);

    // Increment yield by 1 or 0.5 if 1
    const increment = useCallback(() => {
        const newYield = state.currentYield < 1 ? 1 : state.currentYield + 1;
        const validationError = validateYield(newYield, state.originalYield);

        // If at maximum, no-op (don't show error)
        if (validationError?.type === 'above_maximum') {
            return;
        }

        adjustYield(newYield);
    }, [state.currentYield, state.originalYield, adjustYield]);

    // Decrement yield by 1 or 0.5 if < 1
    const decrement = useCallback(() => {
        const newYield = state.currentYield === 1 ? 0.5 : state.currentYield - 1;
        const validationError = validateYield(newYield, state.originalYield);

        // If at minimum, no-op (don't show error)
        if (validationError?.type === 'below_minimum') {
            return;
        }

        adjustYield(newYield);
    }, [state.currentYield, state.originalYield, adjustYield]);

    // Reset to original yield
    const reset = useCallback(() => {
        setError(null);
        setState({
            ...state,
            currentYield: state.originalYield,
            yieldMultiplier: 1.0,
            isAdjusted: false,
        });
    }, [state]);

    // Calculate scaled ingredients (memoized)
    const scaledIngredients = useMemo<ScaledIngredient[] | undefined>(() => {
        if (!recipe.parsedIngredients) {
            return undefined;
        }

        return recipe.parsedIngredients.map(ingredient => {
            if (!ingredient.quantity) {
                return {original: ingredient, scaledQuantity: null, displayQuantity: '', wasScaled: false};
            }

            // Handle both string and number quantity (for backwards compatibility)
            const scaledQty = scaleQuantity(fractionToDecimal(ingredient.quantity), state.yieldMultiplier);
            const wasScaled = state.yieldMultiplier !== 1.0 && scaledQty !== null;

            // Format display quantity
            let displayQuantity = '';
            if (scaledQty !== null) {
                const fraction = decimalToFraction(scaledQty);
                displayQuantity = fraction.formatted;
            }

            // Add warning for very small quantities
            let warning: string | undefined;
            if (scaledQty !== null && scaledQty < 0.1 && scaledQty > 0) {
                warning = 'Very small amount';
            }

            return {
                original: ingredient,
                scaledQuantity: scaledQty,
                displayQuantity,
                wasScaled,
                warning,
            };
        });
    }, [recipe.parsedIngredients, state.yieldMultiplier]);

    return {
        yieldState: state,
        scaledIngredients,
        adjustYield,
        increment,
        decrement,
        reset,
        error,
    };
}
