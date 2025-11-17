import * as z from "zod";
import type { ParsedIngredient } from "@/models/ParsedIngredient";

/**
 * Zod schema for Schema.org Recipe from JSON-LD
 * Based on https://schema.org/Recipe
 */
export const SchemaOrgRecipeSchema = z.object({
    '@context': z.string().optional(),
    '@type': z.union([z.string(), z.array(z.string())]).optional(),
    name: z.string().optional(),
    image: z.union([
        z.string(),
        z.array(z.string()),
        z.array(z.object({ url: z.string() }))
    ]).optional(),
    description: z.string().optional(),
    author: z.union([
        z.string(),
        z.object({ name: z.string() })
    ]).optional(),
    datePublished: z.string().optional(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    totalTime: z.string().optional(),
    recipeYield: z.union([z.string(), z.number()]).optional(),
    recipeCategory: z.union([z.string(), z.array(z.string())]).optional(),
    recipeCuisine: z.union([z.string(), z.array(z.string())]).optional(),
    recipeIngredient: z.array(z.string()).optional(),
    recipeInstructions: z.union([
        z.array(z.string()),
        z.array(z.object({ text: z.string() })),
        z.array(z.object({ name: z.string().optional(), text: z.string() }))
    ]).optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    nutrition: z.object({
        calories: z.string().optional(),
    }).optional(),
    aggregateRating: z.object({
        ratingValue: z.number().optional(),
        ratingCount: z.number().optional(),
    }).optional(),
    suitableForDiet: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Zod schema for nutritional information
 * Based on schema.org/NutritionInformation
 */
export const NutritionalInfoSchema = z.object({
    servingSize: z.string().optional(),
    calories: z.string().optional(),
    carbohydrateContent: z.string().optional(),
    proteinContent: z.string().optional(),
    fatContent: z.string().optional(),
    saturatedFatContent: z.string().optional(),
    unsaturatedFatContent: z.string().optional(),
    transFatContent: z.string().optional(),
    cholesterolContent: z.string().optional(),
    sodiumContent: z.string().optional(),
    fiberContent: z.string().optional(),
    sugarContent: z.string().optional(),
}).partial();

/**
 * Zod schema for aggregate rating
 * Based on schema.org/AggregateRating
 */
export const AggregateRatingSchema = z.object({
    ratingValue: z.number().optional(),
    ratingCount: z.number().optional(),
}).partial();

/**
 * Zod schema for Recipe
 * Based on schema.org/Recipe and Google structured data guidelines
 */
export const RecipeSchema = z.object({
    // Firestore metadata
    id: z.string().optional(),
    createdBy: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),

    // Required properties
    name: z.string(),
    image: z.union([z.string(), z.array(z.string())]),

    // Highly recommended properties
    description: z.string().optional(),
    recipeIngredient: z.array(z.string()),
    recipeInstructions: z.array(z.string()),
    recipeYield: z.string().optional(),

    // Time properties (ISO 8601 duration format)
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    totalTime: z.string().optional(),

    // Categorization and discovery
    recipeCategory: z.array(z.string()).optional(),
    recipeCuisine: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),

    // Additional optional properties
    author: z.string().optional(),
    datePublished: z.date().optional(),
    aggregateRating: AggregateRatingSchema.optional(),
    suitableForDiet: z.array(z.string()).optional(),

    // Nutrition information
    nutrition: NutritionalInfoSchema.optional(),

    // Image upload metadata
    imageSource: z.enum(['upload', 'url']).optional(),

    // Ingredient parsing metadata (new fields for ingredient parsing feature)
    parsedIngredients: z.custom<ParsedIngredient[]>().optional(),
    ingredientParsingCompleted: z.boolean().optional(),
    ingredientParsingDate: z.date().optional(),

    // Instruction scaling metadata (new fields for instruction scaling feature)
    /** Parsed instructions with segments for precise scaling control */
    parsedInstructions: z.custom<StructuredInstruction[]>().optional(),
    /** User's manual exclusions of specific ingredient references from scaling */
    scalingExclusions: z.custom<ScalingExclusion[]>().optional(),
});

// Export TypeScript types inferred from Zod schemas
export type SchemaOrgRecipe = z.infer<typeof SchemaOrgRecipeSchema>;
export type IRecipeNutrition = z.infer<typeof NutritionalInfoSchema>;
export type IRecipe = z.infer<typeof RecipeSchema>;

/**
 * State for recipe yield adjustment
 */
export interface YieldAdjustmentState {
    /** Original yield value parsed from a recipe */
    originalYield: number;

    /** Current yield value set by user */
    currentYield: number;

    /** Calculated multiplier: currentYield / originalYield */
    yieldMultiplier: number;

    /** Whether the yield has been adjusted from original */
    isAdjusted: boolean;

    /** Optional: Original yield string for display (e.g., "4 servings") */
    originalYieldString?: string;
}

/**
 * Ingredient with quantities scaled by yield multiplier
 */
export interface ScaledIngredient {
    /** Original parsed ingredient data */
    original: ParsedIngredient;

    /** Scaled quantity value (null if not scalable) */
    scaledQuantity: number | null;

    /** Display string for scaled quantity (includes fraction formatting) */
    displayQuantity: string;

    /** Whether this ingredient was scaled */
    wasScaled: boolean;

    /** Optional warning for edge cases (e.g., "Very small amount", "Rounded to nearest whole") */
    warning?: string;
}

/**
 * Representation of a quantity as a fraction
 */
export interface FractionDisplay {
    /** Whole number part (e.g., 1 in "1 1/2") */
    whole: number;

    /** Numerator of fractional part (e.g., 1 in "1/2") */
    numerator: number;

    /** Denominator of fractional part (e.g., 2 in "1/2") */
    denominator: number;

    /** Formatted string (e.g., "1 1/2", "3/4", "2") */
    formatted: string;
}

/**
 * Validation error for yield input
 */
export interface YieldValidationError {
    /** Error type */
    type: 'below_minimum' | 'above_maximum' | 'invalid_number';

    /** User-friendly error message */
    message: string;

    /** Suggested corrected value (if applicable) */
    suggestedValue?: number;
}

/**
 * A reference to an ingredient within instruction text
 */
export interface IngredientReference {
    /** The full matched text (e.g., "**2 eggs**") */
    fullMatch: string;

    /** The ingredient name as it appears in text (e.g., "eggs") */
    ingredientName: string;

    /** The quantity as it appears in text (e.g., "2", "1.5", "1/2") */
    originalQuantity: string;

    /** The unit if present (e.g., "cups", "tbsp", null for count items) */
    unit: string | null;

    /** Formatting markers before quantity (e.g., "**") */
    preFormat: string;

    /** Formatting markers after ingredient (e.g., "**") */
    postFormat: string;

    /** Start index in the instruction string */
    startIndex: number;

    /** End index in the instruction string */
    endIndex: number;

    /** Whether this reference matched an ingredient from the recipe's ingredient list */
    isMatched: boolean;

    /** The matched ParsedIngredient from recipe (if isMatched = true) */
    matchedIngredient?: ParsedIngredient;
}

/**
 * Result of scaling a single instruction with ingredient quantities
 */
export interface ScaledInstruction {
    /** Original instruction text */
    original: string;

    /** Scaled instruction text with updated quantities */
    scaled: string;

    /** Whether any scaling occurred in this instruction */
    wasScaled: boolean;

    /** Number of ingredient references found */
    referenceCount: number;

    /** Ingredient references that were found and processed */
    references: IngredientReference[];

    /** Warnings for edge cases (e.g., "Ambiguous reference: multiple flours found") */
    warnings: string[];
}

/**
 * Options for customizing instruction scaling behavior
 */
export interface InstructionScalingOptions {
    /** Whether to preserve markdown formatting (default: true) */
    preserveFormatting: boolean;

    /** Whether to use fraction symbols (½, ⅓) instead of decimals (default: true) */
    useFractionSymbols: boolean;

    /** Whether to scale "to taste" ingredients (default: false) */
    scaleToTaste: boolean;

    /** Minimum confidence threshold for ingredient matching (0-1, default: 0.7) */
    matchConfidenceThreshold: number;

    /** Whether to log warnings for ambiguous matches (default: true in dev) */
    logWarnings: boolean;

    /** Maximum number of references to process per instruction (default: 20) */
    maxReferencesPerInstruction: number;
}

/**
 * Segment-based instruction data model
 * Instructions are parsed into segments for precise control over scaling
 */

/**
 * Text segment - plain text with no scaling
 */
export interface TextSegment {
    type: 'text';
    content: string;
}

/**
 * Ingredient reference segment - contains a scalable ingredient reference
 */
export interface IngredientRefSegment {
    type: 'ingredient_ref';
    /** The matched text (e.g., "2 cups flour") */
    originalText: string;
    /** The ingredient name from the recipe ingredient list */
    ingredientName: string;
    /** Original quantity as string (e.g., "2", "1.5", "1/2") */
    originalQuantity: string;
    /** Optional unit (e.g., "cup", "tbsp", null) */
    unit: string | null;
    /** Preposition if present (e.g., "of", "with", null) */
    preposition: string | null;
    /** Index in the original ingredient list for lookup */
    ingredientIndex: number;
    /** Whether scaling is disabled by user for this specific reference */
    scalingDisabled: boolean;
    /** Text before ingredient (for formatting) */
    preFormat?: string;
    /** Text after ingredient (for formatting) */
    postFormat?: string;
}

/**
 * Discriminated union of all segment types
 */
export type InstructionSegment = TextSegment | IngredientRefSegment;

/**
 * Structured instruction with segments
 */
export interface StructuredInstruction {
    /** Unique identifier for this instruction */
    id: string;
    /** Original full instruction text (for rebuilding) */
    originalText: string;
    /** Parsed segments */
    segments: InstructionSegment[];
    /** Step number (1-based) */
    stepNumber: number;
}

/**
 * User's manual exclusion of a specific ingredient reference from scaling
 */
export interface ScalingExclusion {
    /** Unique identifier for this exclusion */
    id: string;
    /** Instruction step number (1-based) */
    stepNumber: number;
    /** The exact text that was excluded (for matching during rebuilds) */
    excludedText: string;
    /** The ingredient name that was excluded */
    ingredientName: string;
    /** Timestamp when exclusion was created */
    createdAt: number;
}
