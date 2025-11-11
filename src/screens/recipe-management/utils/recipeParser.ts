import type {IRecipe, IRecipeNutrition, SchemaOrgRecipe} from '@/screens/recipe-management/types/Recipe.ts';
import {preprocessJsonInput} from "@/screens/recipe-management/utils/parsing/preprocessor.ts";

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

                // If name and text are the same (or text starts with name), just use text
                if (hasName && instruction.name && instruction.text.trim().startsWith(instruction.name.trim())) {
                    return instruction.text;
                }

                // If they're different, prefix with name
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
 * Detects if input looks like escaped JSON and provides helpful guidance
 */
function detectInputFormat(input: string): {isEscaped: boolean; hint?: string} {
    const trimmed = input.trim();

    // Check for escaped newlines and quotes (common in console output)
    if (trimmed.includes('\\n') && trimmed.includes('\\')) {
        return {
            isEscaped: true,
            hint: 'It looks like you pasted escaped JSON from console output. The parser will try to unescape it automatically.'
        };
    }

    // Check for backticks (template literal)
    if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        return {
            isEscaped: true,
            hint: 'Detected backticks around JSON. The parser will remove them automatically.'
        };
    }

    return {isEscaped: false};
}

/**
 * Parses schema.org Recipe JSON-LD to IRecipe format
 */
export function parseRecipeJsonLd(jsonLdText: string): RecipeParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Preprocess the input
    const preprocessed = preprocessJsonInput(jsonLdText);

    // Parse JSON
    let jsonData: unknown;
    try {
        jsonData = JSON.parse(preprocessed);
    } catch {
        // Detect input format to provide better error message
        const {isEscaped, hint} = detectInputFormat(jsonLdText);

        const errorMessages = ['Invalid JSON format. Please check your input.'];

        if (isEscaped) {
            errorMessages.push(hint || 'The input appears to contain escaped characters.');
            errorMessages.push('Try copying the raw JSON content instead of the console output.');
        } else {
            errorMessages.push('Make sure you copied the complete JSON structure with all opening and closing brackets.');
            errorMessages.push('Verify there are no syntax errors like trailing commas or unescaped quotes.');
        }

        return {
            success: false,
            errors: errorMessages,
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
// For most sites (single JSON-LD script):
copy(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent))

// For sites with multiple JSON-LD scripts (like RecipeTinEats):
copy(Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map(s => JSON.parse(s.textContent))
  .find(obj => obj['@type'] === 'Recipe' || obj['@graph']?.find(g => g['@type'] === 'Recipe')))
\`\`\`

5. The JSON will be copied to your clipboard
6. Paste it in the text area below

**Note:** The parser accepts multiple formats:
- Raw JSON (recommended)
- Escaped JSON from console output
- JSON wrapped in backticks

If using Chrome/Edge, the \`copy()\` command automatically copies to clipboard.
For Firefox, you may need to use \`console.log()\` and manually copy the output.`;
}