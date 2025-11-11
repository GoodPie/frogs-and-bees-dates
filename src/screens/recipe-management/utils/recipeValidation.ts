import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";

/**
 * Validates a recipe object for required fields
 * @param recipe - Recipe object to validate
 * @returns Object with isValid boolean and error messages
 */
export const validateRecipe = (recipe: Partial<IRecipe>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!recipe.name || recipe.name.trim() === '') {
        errors.push('Recipe name is required');
    }

    if (!recipe.image || (Array.isArray(recipe.image) && recipe.image.length === 0)) {
        errors.push('At least one image is required');
    }

    // Highly recommended fields for Google structured data
    if (!recipe.recipeIngredient || recipe.recipeIngredient.length === 0) {
        errors.push('At least one ingredient is required');
    }

    if (!recipe.recipeInstructions || recipe.recipeInstructions.length === 0) {
        errors.push('At least one instruction step is required');
    }

    // Validate parsedIngredients if present
    if (recipe.parsedIngredients && recipe.recipeIngredient) {
        if (recipe.parsedIngredients.length !== recipe.recipeIngredient.length) {
            errors.push('Parsed ingredients count must match recipe ingredients count');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates an image URL
 * @param url - Image URL to validate
 * @returns True if URL is valid
 */
export const validateImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;

    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Validates ISO 8601 duration format
 * @param duration - Duration string to validate
 * @returns True if duration is valid ISO 8601 format
 */
export const validateISO8601Duration = (duration: string): boolean => {
    if (!duration) return false;

    // ISO 8601 duration format: PT[hours]H[minutes]M
    const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?$/;
    return regex.test(duration);
};

/**
 * Removes undefined values from an object
 * @param obj - Object to clean
 * @returns Object with undefined values removed
 */
const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
};

/**
 * Sanitizes recipe data before saving
 * @param recipe - Recipe object to sanitize
 * @returns Sanitized recipe object
 */
export const sanitizeRecipe = (recipe: Partial<IRecipe>): Partial<IRecipe> => {
    const sanitized = {
        ...recipe,
        name: recipe.name?.trim(),
        description: recipe.description?.trim(),
        recipeIngredient: recipe.recipeIngredient?.filter(instruction => instruction.trim() !== ''),
        recipeInstructions: recipe.recipeInstructions?.filter(instruction => instruction.trim() !== ''),
        recipeCategory: recipe.recipeCategory?.filter(category => category.trim() !== ''),
        recipeCuisine: recipe.recipeCuisine?.filter(cuisine => cuisine.trim() !== ''),
        keywords: recipe.keywords?.filter(keyword => keyword.trim() !== ''),
        // Clean nutrition object to remove undefined values
        nutrition: recipe.nutrition ? removeUndefined(recipe.nutrition) : undefined,
        aggregateRating: recipe.aggregateRating ? removeUndefined(recipe.aggregateRating) : undefined,
    };

    // Remove top-level undefined values (including empty nutrition/aggregateRating)
    return removeUndefined(sanitized);
};
