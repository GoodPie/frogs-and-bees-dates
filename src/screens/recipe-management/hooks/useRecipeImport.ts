import {useState} from 'react';
import {parseRecipeJsonLd, type RecipeParseResult} from '@/screens/recipe-management/utils/recipeParser.ts';
import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";
import {parseIngredients} from '@/services/ingredientParser.ts';

export interface RecipeImportState {
    // URL input
    url: string;
    setUrl: (url: string) => void;

    // JSON-LD input
    jsonLdText: string;
    setJsonLdText: (text: string) => void;

    // Parse result
    parseResult: RecipeParseResult | null;

    // Loading states
    parsing: boolean;
    isParsing: boolean;

    // Actions
    parseJsonLd: () => void;
    reset: () => void;
    getParsedRecipe: () => Partial<IRecipe> | null;
}

/**
 * Hook for managing recipe import from JSON-LD
 */
export function useRecipeImport(): RecipeImportState {
    const [url, setUrl] = useState('');
    const [jsonLdText, setJsonLdText] = useState('');
    const [parseResult, setParseResult] = useState<RecipeParseResult | null>(null);
    const [parsing, setParsing] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    const parseJsonLd = async () => {
        if (!jsonLdText.trim()) {
            setParseResult({
                success: false,
                errors: ['Please paste JSON-LD data'],
                warnings: [],
            });
            return;
        }

        setParsing(true);

        // Use setTimeout to allow UI to update with loading state
        setTimeout(async () => {
            const result = parseRecipeJsonLd(jsonLdText);

            // If parsing succeeded and recipe has ingredients, parse them
            if (result.success && result.recipe && result.recipe.recipeIngredient) {
                setIsParsing(true);
                try {
                    const ingredients = result.recipe.recipeIngredient;

                    // Add parsed ingredients to recipe
                    result.recipe.parsedIngredients = await parseIngredients(ingredients);
                    result.recipe.ingredientParsingCompleted = true;
                    result.recipe.ingredientParsingDate = new Date();
                } catch (error) {
                    console.error('Ingredient parsing failed:', error);
                    // Add warning but don't fail the entire import
                    result.warnings.push('Failed to parse ingredients. You can edit them manually.');
                } finally {
                    setIsParsing(false);
                }
            }

            setParseResult(result);
            setParsing(false);
        }, 100);
    };

    const reset = () => {
        setUrl('');
        setJsonLdText('');
        setParseResult(null);
        setParsing(false);
        setIsParsing(false);
    };

    const getParsedRecipe = (): Partial<IRecipe> | null => {
        if (!parseResult?.success || !parseResult.recipe) {
            return null;
        }
        return parseResult.recipe;
    };

    return {
        url,
        setUrl,
        jsonLdText,
        setJsonLdText,
        parseResult,
        parsing,
        isParsing,
        parseJsonLd,
        reset,
        getParsedRecipe,
    };
}
