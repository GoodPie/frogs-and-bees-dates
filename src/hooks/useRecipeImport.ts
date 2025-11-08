import {useState} from 'react';
import {parseRecipeJsonLd, type RecipeParseResult} from '@/utils/recipeParser';
import type {IRecipe} from "@/types/recipe/Recipe.ts";

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

    const parseJsonLd = () => {
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
        setTimeout(() => {
            const result = parseRecipeJsonLd(jsonLdText);
            setParseResult(result);
            setParsing(false);
        }, 100);
    };

    const reset = () => {
        setUrl('');
        setJsonLdText('');
        setParseResult(null);
        setParsing(false);
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
        parseJsonLd,
        reset,
        getParsedRecipe,
    };
}
