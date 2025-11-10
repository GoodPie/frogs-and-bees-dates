/**
 * React hook for ingredient parsing with loading and error states
 *
 * Provides a convenient interface for React components to parse ingredients
 * using Firebase AI Logic, with automatic state management for loading and errors.
 *
 * @module hooks/useIngredientParser
 *
 * @example
 * ```typescript
 * function RecipeImport() {
 *   const { parseIngredients, isLoading, error, clearError } = useIngredientParser();
 *
 *   const handleParse = async (ingredients: string[]) => {
 *     try {
 *       const result = await parseIngredients(ingredients);
 *       console.log('Parsed:', result);
 *     } catch (err) {
 *       // Error already captured in hook state
 *     }
 *   };
 *
 *   return (
 *     <>
 *       {isLoading && <Spinner />}
 *       {error && <Alert status="error">{error}</Alert>}
 *       <Button onClick={() => handleParse(rawIngredients)}>Parse</Button>
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { parseIngredients as parseIngredientsService } from '@/services/ingredientParser';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

/**
 * Hook return type
 */
export interface UseIngredientParserReturn {
  /**
   * Function to parse ingredients
   * @param ingredients - Array of raw ingredient strings
   * @returns Promise resolving to array of ParsedIngredient objects
   * @throws {Error} On parsing failure (also sets error state)
   */
  parseIngredients: (ingredients: string[]) => Promise<ParsedIngredient[]>;

  /**
   * True while parsing is in progress
   */
  isLoading: boolean;

  /**
   * Error message if parsing failed, null otherwise
   */
  error: string | null;

  /**
   * Clears the error state
   */
  clearError: () => void;
}

/**
 * React hook for parsing ingredients with state management
 *
 * @returns Object containing parseIngredients function, loading state, error state, and clearError function
 *
 * @example
 * ```typescript
 * const { parseIngredients, isLoading, error, clearError } = useIngredientParser();
 *
 * const handleImport = async () => {
 *   try {
 *     const parsed = await parseIngredients(ingredients);
 *     setParsedIngredients(parsed);
 *   } catch (err) {
 *     // Error is already in hook state
 *     console.error('Parsing failed');
 *   }
 * };
 * ```
 */
export function useIngredientParser(): UseIngredientParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parses ingredients with automatic loading and error state management
   */
  const parseIngredients = useCallback(async (ingredients: string[]): Promise<ParsedIngredient[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseIngredientsService(ingredients);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse ingredients';
      setError(errorMessage);
      throw err; // Re-throw for caller to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    parseIngredients,
    isLoading,
    error,
    clearError,
  };
}
