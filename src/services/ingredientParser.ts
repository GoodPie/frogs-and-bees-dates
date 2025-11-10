/**
 * Ingredient Parser Service
 *
 * Parses unstructured ingredient strings into structured components using Firebase AI Logic (Gemini API).
 * Provides automatic metric conversion for imperial measurements and handles complex ingredient formats.
 *
 * @module services/ingredientParser
 */

import {ai} from "@/FirebaseConfig";
import type {ParsedIngredient} from "@/models/ParsedIngredient";
import {getGenerativeModel, Schema} from "firebase/ai";

/**
 * Schema definition for ingredient parsing using Firebase AI Logic Schema API
 * Defines the structure for structured output from Gemini
 */
export const ingredientSchema = Schema.object({
    properties: {
        quantity: Schema.string(),
        unit: Schema.string(),
        ingredientName: Schema.string(),
        preparationNotes: Schema.string(),
        metricQuantity: Schema.string(),
        metricUnit: Schema.string(),
        confidence: Schema.number(),
    },
    optionalProperties: [
        'quantity',
        'unit',
        'preparationNotes',
        'metricQuantity',
        'metricUnit'
    ],
});

/**
 * Type for the API response from Gemini
 */
interface GeminiIngredientResponse {
    quantity?: string;
    unit?: string;
    ingredientName: string;
    preparationNotes?: string;
    metricQuantity?: string;
    metricUnit?: string;
    confidence?: number;
}

/**
 * Builds the batch prompt for Gemini API ingredient parsing
 *
 * @param ingredients - Array of raw ingredient strings
 * @returns Formatted prompt for Gemini
 *
 * @example
 * ```typescript
 * const prompt = buildBatchPrompt([
 *   "2 cups all-purpose flour",
 *   "1/2 tsp salt"
 * ]);
 * ```
 */
export function buildBatchPrompt(ingredients: string[]): string {
    return `Parse these recipe ingredients into structured JSON format. For each ingredient:

1. Extract quantity (numeric value, preserve ranges like "2-3" and fractions like "1/2")
2. Extract unit (cups, tsp, tbsp, oz, lb, g, ml, kg, l, etc.)
3. Extract ingredient name (without quantity/unit)
4. Extract preparation notes (after comma: chopped, softened, diced, etc.)
5. Convert imperial units to metric using these rules:

**Volume Conversions (liquid ingredients):**
- 1 cup = 237 ml
- 1 tbsp (tablespoon) = 15 ml
- 1 tsp (teaspoon) = 5 ml
- 1 fl oz = 30 ml

**Weight Conversions:**
- 1 lb (pound) = 454 g
- 1 oz (ounce) = 28 g

**Density-Based Conversions (volume to weight for dry/solid ingredients):**
- All-purpose flour: 1 cup = 120 g
- Bread flour: 1 cup = 127 g
- Whole wheat flour: 1 cup = 120 g
- Sugar (granulated): 1 cup = 200 g
- Brown sugar (packed): 1 cup = 220 g
- Powdered sugar: 1 cup = 120 g
- Butter: 1 cup = 227 g, 1 tbsp = 14 g
- Cocoa powder: 1 cup = 120 g
- Honey: 1 cup = 340 g
- Milk: 1 cup = 237 ml
- Water: 1 cup = 237 ml
- Oil: 1 cup = 224 g

**Unusual Units (no metric conversion):**
- pinch, dash, knob, sprig, bunch, clove, head, stalk, leaf, slice
- For these units, set metricQuantity and metricUnit to null

**Complex Cases:**
- For ranges (e.g., "2-3 cups"), preserve the range in quantity and calculate range for metricQuantity (e.g., "240-360")
- For preparation notes (e.g., "chopped", "softened", "diced"), extract them into preparationNotes field
- For multiple preparation notes (e.g., "peeled and minced"), combine them in preparationNotes
- For vague quantities (e.g., "some", "a handful"), set confidence below 0.7
- For multiple ingredients in one string (e.g., "salt and pepper to taste"), combine into ingredientName and set confidence below 0.7

**Confidence Scoring:**
- High confidence (0.85-1.0): Clear quantity, standard unit, common ingredient
- Medium confidence (0.7-0.84): Ranges, unusual units, or complex preparation notes
- Low confidence (<0.7): Vague quantities, multiple ingredients, or ambiguous descriptions

**Important Rules:**
- If ingredient is already in metric (g, ml, kg, l), set metricQuantity and metricUnit to null
- For liquids (water, milk, juice, oil, etc.), use ml for volume
- For dry/solid ingredients measured by volume, convert to weight (g) using density
- If unsure about density, convert volume to ml
- Provide confidence score (0-1) based on parsing certainty

Ingredients to parse:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Return a JSON array of parsed ingredients in the exact same order as above.`;
}

/**
 * Validates input before sending to Firebase AI Logic
 *
 * @param ingredients - Array of ingredient strings to validate
 * @throws {Error} If validation fails
 */
function validateInput(ingredients: string[]): void {
    if (!Array.isArray(ingredients)) {
        throw new Error('Ingredients must be an array');
    }
    if (ingredients.length === 0) {
        throw new Error('Ingredients array cannot be empty');
    }
    if (ingredients.length > 20) {
        throw new Error('Maximum 20 ingredients per request');
    }
    ingredients.forEach((ingredient, i) => {
        // Runtime type check for safety (protects against invalid data at runtime)
        if (typeof ingredient !== 'string') {
            throw new Error(`Ingredient at index ${i} must be a string`);
        }
        if (ingredient.length > 500) {
            throw new Error(`Ingredient at index ${i} exceeds 500 characters`);
        }
    });
}

/**
 * Parses an array of ingredient strings using Firebase AI Logic
 *
 * @param ingredients - Array of raw ingredient strings (e.g., ["2 cups flour", "1 tsp salt"])
 * @returns Promise resolving to array of ParsedIngredient objects
 * @throws {Error} On network failure, validation error, or parsing failure
 *
 * @example
 * ```typescript
 * const parsed = await parseIngredients([
 *   "2 cups all-purpose flour",
 *   "1/2 tsp salt",
 *   "1 cup butter, softened"
 * ]);
 * console.log(parsed[0].metricQuantity); // "240"
 * console.log(parsed[0].metricUnit); // "g"
 * ```
 */
export async function parseIngredients(
    ingredients: string[]
): Promise<ParsedIngredient[]> {
    // Validate input
    validateInput(ingredients);

    try {
        // Get Gemini model instance
        const model = getGenerativeModel(ai, {
            model: "gemini-2.5-flash",
        });

        // Build prompt with ingredient parsing instructions
        const prompt = buildBatchPrompt(ingredients);

        // Generate content with structured output
        const result = await model.generateContent({
            contents: [{role: "user", parts: [{text: prompt}]}],
            generationConfig: {
                responseMimeType: "application/json",
                // Type assertion needed due to Firebase AI Schema type definitions
                responseSchema: Schema.array({
                    items: ingredientSchema
                }),
            },
        });

        // Parse the JSON response
        const response = result.response;
        const text = response.text();
        const parsedData = JSON.parse(text);

        // Transform API response to ParsedIngredient format
        return parsedData.map((item: GeminiIngredientResponse, index: number) => ({
            originalText: ingredients[index],
            quantity: item.quantity || null,
            unit: item.unit || null,
            ingredientName: item.ingredientName,
            preparationNotes: item.preparationNotes || null,
            metricQuantity: item.metricQuantity || null,
            metricUnit: item.metricUnit || null,
            confidence: item.confidence || 0.5,
            requiresManualReview: (item.confidence || 0.5) < 0.7,
        })) as ParsedIngredient[];

    } catch (error) {
        // Log the actual error for debugging
        console.error('Ingredient parsing error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new Error('Failed to connect to Firebase AI Logic');
            }
            if (error.message.includes('rate limit') || error.message.includes('quota')) {
                throw new Error('Rate limit exceeded, please try again later');
            }
            if (error.message.includes('Invalid') || error.message.includes('Ingredients')) {
                throw error; // Re-throw validation errors
            }
        }

        // Throw with more context
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse ingredients: ${errorMessage}`);
    }
}
