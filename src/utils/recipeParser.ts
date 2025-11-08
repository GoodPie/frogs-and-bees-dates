import type {IRecipe} from '@/interfaces/IRecipe';
import type {IRecipeNutrition} from "@/types/recipe/Recipe.ts";

/**
 * Schema.org Recipe type from JSON-LD
 * Based on https://schema.org/Recipe
 */
interface SchemaOrgRecipe {
    '@context'?: string;
    '@type'?: string | string[];
    name?: string;
    image?: string | string[] | {url: string}[];
    description?: string;
    author?: {name: string} | string;
    datePublished?: string;
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    recipeYield?: string | number;
    recipeCategory?: string | string[];
    recipeCuisine?: string | string[];
    recipeIngredient?: string[];
    recipeInstructions?: string[] | {text: string}[] | {name?: string; text: string}[];
    keywords?: string | string[];
    nutrition?: {
        calories?: string;
    };
    aggregateRating?: {
        ratingValue?: number;
        ratingCount?: number;
    };
    suitableForDiet?: string | string[];
}

export interface RecipeParseResult {
    success: boolean;
    recipe?: Partial<IRecipe>;
    errors: string[];
    warnings: string[];
}

/**
 * Extracts image URL from various schema.org image formats
 */
function extractImageUrl(image: string | string[] | {url: string}[] | undefined): string {
    if (!image) return '';

    if (typeof image === 'string') {
        return image;
    }

    if (Array.isArray(image)) {
        if (image.length === 0) return '';

        const first = image[0];
        if (typeof first === 'string') {
            return first;
        }
        if (typeof first === 'object' && 'url' in first) {
            return first.url;
        }
    }

    return '';
}

/**
 * Extracts instructions from various schema.org formats
 */
function extractInstructions(instructions: string[] | {text: string}[] | {name?: string; text: string}[] | undefined): string[] {
    if (!instructions) return [];

    if (Array.isArray(instructions)) {
        return instructions.map(instruction => {
            if (typeof instruction === 'string') {
                return instruction;
            }
            if (typeof instruction === 'object' && 'text' in instruction) {
                // Some recipes have HowToStep with optional name
                const hasName = 'name' in instruction && instruction.name;
                const prefix = hasName ? `${instruction.name}: ` : '';
                return prefix + instruction.text;
            }
            return '';
        }).filter(i => i.trim() !== '');
    }

    return [];
}

/**
 * Converts schema.org author format to string
 */
function extractAuthor(author: {name: string} | string | undefined): string | undefined {
    if (!author) return undefined;

    if (typeof author === 'string') {
        return author;
    }

    if (typeof author === 'object' && 'name' in author) {
        return author.name;
    }

    return undefined;
}

/**
 * Converts nutrition information, removing units
 */
function extractNutrition(nutrition: SchemaOrgRecipe['nutrition']): IRecipeNutrition | undefined {
    if (!nutrition) return undefined;

    const result: IRecipeNutrition = {
        calories: parseValue(nutrition.calories),
    };

    // Only return if at least one value exists
    return Object.values(result).some(v => v) ? result : undefined;
}

/**
 * Ensures value is an array
 */
function ensureArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Parses numeric value from nutrition strings, removing units
 * Examples: "270 calories" -> "270", "14g" -> "14"
 */
function parseValue(value: string | undefined): string | undefined {
    if (!value) return undefined;

    // Extract the numeric portion (including decimals)
    const match = value.match(/[\d.]+/);
    return match ? match[0] : undefined;
}

/**
 * Parses schema.org Recipe JSON-LD to IRecipe format
 */
export function parseRecipeJsonLd(jsonLdText: string): RecipeParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse JSON
    let jsonData: unknown;
    try {
        jsonData = JSON.parse(jsonLdText);
    } catch {
        return {
            success: false,
            errors: ['Invalid JSON format. Please check your input.'],
            warnings: [],
        };
    }

    // Handle @graph wrapper (some sites use this)
    let recipeData: SchemaOrgRecipe | undefined;

    if (Array.isArray(jsonData)) {
        // Some sites have array of objects, find the Recipe
        recipeData = jsonData.find((item: unknown) => {
            if (typeof item === 'object' && item !== null && '@type' in item) {
                const type = (item as {['@type']: string | string[]})['@type'];
                return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
            }
            return false;
        }) as SchemaOrgRecipe;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
        const obj = jsonData as Record<string, unknown>;

        if ('@graph' in obj && Array.isArray(obj['@graph'])) {
            // Handle @graph wrapper
            recipeData = obj['@graph'].find((item: unknown) => {
                if (typeof item === 'object' && item !== null && '@type' in item) {
                    const type = (item as {['@type']: string | string[]})['@type'];
                    return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
                }
                return false;
            }) as SchemaOrgRecipe;
        } else if ('@type' in obj) {
            // Direct Recipe object
            const type = obj['@type'];
            if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
                recipeData = obj as SchemaOrgRecipe;
            }
        }
    }

    if (!recipeData) {
        return {
            success: false,
            errors: ['No Recipe schema found in JSON-LD. Please ensure the data contains a Recipe type.'],
            warnings: [],
        };
    }

    // Validate required fields
    if (!recipeData.name || recipeData.name.trim() === '') {
        errors.push('Recipe name is required');
    }

    const imageUrl = extractImageUrl(recipeData.image);
    if (!imageUrl) {
        errors.push('Recipe image is required');
    }

    // Validate optional but important fields
    if (!recipeData.recipeIngredient || recipeData.recipeIngredient.length === 0) {
        warnings.push('No ingredients found');
    }

    if (!recipeData.recipeInstructions) {
        warnings.push('No instructions found');
    }

    // Build recipe object
    const recipe: Partial<IRecipe> = {
        name: recipeData.name?.trim() || '',
        image: imageUrl,
        imageSource: 'url',
        description: recipeData.description?.trim(),
        author: extractAuthor(recipeData.author),
        datePublished: recipeData.datePublished ? new Date(recipeData.datePublished) : undefined,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        totalTime: recipeData.totalTime,
        recipeYield: recipeData.recipeYield?.toString(),
        recipeIngredient: recipeData.recipeIngredient || [],
        recipeInstructions: extractInstructions(recipeData.recipeInstructions),
        recipeCategory: ensureArray(recipeData.recipeCategory),
        recipeCuisine: ensureArray(recipeData.recipeCuisine),
        keywords: ensureArray(recipeData.keywords),
        nutrition: extractNutrition(recipeData.nutrition),
        aggregateRating: recipeData.aggregateRating,
        suitableForDiet: ensureArray(recipeData.suitableForDiet),
    };

    return {
        success: errors.length === 0,
        recipe,
        errors,
        warnings,
    };
}

/**
 * Generates instructions for extracting JSON-LD from a webpage
 */
export function getJsonLdExtractionInstructions(url?: string): string {
    const urlPart = url ? `\n1. Open ${url} in your browser` : '\n1. Open the recipe webpage in your browser';

    return `${urlPart}
2. Open browser DevTools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Paste this code and press Enter:

\`\`\`javascript
JSON.stringify(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent), null, 2)
\`\`\`

5. Copy the output (it will be formatted JSON)
6. Paste it in the text area below`;
}