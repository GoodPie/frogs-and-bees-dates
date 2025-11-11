/**
 * Validation utilities for recipe data
 * Provides validation logic for required and optional fields
 * @module utils/parsing/validator
 */

import type {IRecipe} from '@/screens/recipe-management/types/Recipe';
import type {ValidationError, ValidationWarning} from '@/screens/recipe-management/types/errors';

/**
 * Validates required recipe fields
 *
 * @param recipe - Partial recipe object to validate
 * @returns Array of validation errors (empty if all required fields present)
 *
 * @example
 * ```typescript
 * const errors = validateRequiredFields({ name: '', image: 'pic.jpg' });
 * // [{ type: 'missing_required_field', field: 'name', message: '...', severity: 'error' }]
 * ```
 */
export function validateRequiredFields(recipe: Partial<IRecipe>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Name is required
    if (!recipe.name) {
        errors.push({
            type: 'missing_required_field',
            field: 'name',
            message: 'Recipe name is required',
            details: 'The name field is empty or missing from the JSON-LD data',
            severity: 'error',
        });
    }

    // Image is required
    const imageValue = (Array.isArray(recipe.image) && recipe.image.length > 0 ? recipe.image[0] : '');
    if (!imageValue || imageValue.trim() === '') {
        errors.push({
            type: 'missing_required_field',
            field: 'image',
            message: 'Recipe image is required',
            details: 'The image field is empty or missing from the JSON-LD data',
            severity: 'error',
        });
    }

    return errors;
}

/**
 * Validates optional but recommended recipe fields
 *
 * @param recipe - Partial recipe object to validate
 * @returns Array of validation warnings (empty if all recommended fields present)
 *
 * @example
 * ```typescript
 * const warnings = validateOptionalFields({ name: 'Cake', image: 'pic.jpg' });
 * // Contains warnings about missing ingredients, instructions, etc.
 * ```
 */
export function validateOptionalFields(recipe: Partial<IRecipe>): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Ingredients are highly recommended
    if (!recipe.recipeIngredient || recipe.recipeIngredient.length === 0) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'recipeIngredient',
            message: 'No ingredients found',
            actionable: true,
            severity: 'warning',
        });
    }

    // Instructions are highly recommended
    if (!recipe.recipeInstructions || recipe.recipeInstructions.length === 0) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'recipeInstructions',
            message: 'No instructions found',
            actionable: true,
            severity: 'warning',
        });
    }

    // Recipe yield (servings) is recommended
    if (!recipe.recipeYield || (typeof recipe.recipeYield === 'string' && recipe.recipeYield.trim() === '')) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'recipeYield',
            message: 'No serving size specified',
            actionable: true,
            severity: 'warning',
        });
    }

    // Timing info is recommended
    if (!recipe.prepTime && !recipe.cookTime && !recipe.totalTime) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'prepTime,cookTime,totalTime',
            message: 'No timing information found',
            actionable: true,
            severity: 'warning',
        });
    }

    return warnings;
}

/**
 * Validates recipe data format and content quality
 *
 * @param recipe - Partial recipe object to validate
 * @returns Array of data quality warnings
 *
 * @example
 * ```typescript
 * const warnings = validateDataQuality({
 *   name: 'Cake',
 *   image: 'not-a-url',
 *   recipeIngredient: ['salt']
 * });
 * // May contain warnings about image URL format, ingredient count, etc.
 * ```
 */
export function validateDataQuality(recipe: Partial<IRecipe>): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check if image URL looks valid
    if (recipe.image && typeof recipe.image === 'string' && !isValidUrl(recipe.image)) {
        warnings.push({
            type: 'data_quality',
            field: 'image',
            message: 'Image URL may be invalid',
            actionable: true,
            severity: 'warning',
        });
    }

    // Check if recipe has very few ingredients (might be incomplete)
    if (recipe.recipeIngredient && recipe.recipeIngredient.length > 0 && recipe.recipeIngredient.length < 3) {
        warnings.push({
            type: 'data_quality',
            field: 'recipeIngredient',
            message: `Only ${recipe.recipeIngredient.length} ingredient(s) found - recipe may be incomplete`,
            actionable: true,
            severity: 'warning',
        });
    }

    // Check if recipe has very few instructions (might be incomplete)
    if (recipe.recipeInstructions && recipe.recipeInstructions.length > 0 && recipe.recipeInstructions.length < 2) {
        warnings.push({
            type: 'data_quality',
            field: 'recipeInstructions',
            message: 'Only 1 instruction found - recipe may be incomplete',
            actionable: true,
            severity: 'warning',
        });
    }

    // Check if name is very short (might be truncated or placeholder)
    if (recipe.name && typeof recipe.name === 'string' && recipe.name.length < 3) {
        warnings.push({
            type: 'data_quality',
            field: 'name',
            message: 'Recipe name is very short',
            actionable: true,
            severity: 'warning',
        });
    }

    return warnings;
}

/**
 * Validates complete recipe object
 * Combines all validation checks
 *
 * @param recipe - Partial recipe object to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateRecipe(partialRecipe);
 * if (result.errors.length > 0) {
 *   console.error('Validation failed:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Validation warnings:', result.warnings);
 * }
 * ```
 */
export function validateRecipe(recipe: Partial<IRecipe>): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    isValid: boolean;
} {
    const errors = validateRequiredFields(recipe);
    const optionalWarnings = validateOptionalFields(recipe);
    const qualityWarnings = validateDataQuality(recipe);

    return {
        errors,
        warnings: [...optionalWarnings, ...qualityWarnings],
        isValid: errors.length === 0,
    };
}

/**
 * Checks if a string is a valid URL
 *
 * @param url - String to check
 * @returns True if string is a valid URL
 *
 * @example
 * ```typescript
 * isValidUrl('https://example.com/image.jpg') // true
 * isValidUrl('not-a-url') // false
 * isValidUrl('/relative/path') // false
 * ```
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only accept http/https protocols
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Checks if recipe has minimum viable content
 * Used to determine if recipe can be imported
 *
 * @param recipe - Partial recipe object to check
 * @returns True if recipe has name and image (minimum requirements)
 *
 * @example
 * ```typescript
 * hasMinimumViableContent({ name: 'Cake', image: 'pic.jpg' }) // true
 * hasMinimumViableContent({ name: 'Cake' }) // false
 * ```
 */
export function hasMinimumViableContent(recipe: Partial<IRecipe>): boolean {
    return !!(
        recipe.name &&
        typeof recipe.name === 'string' &&
        recipe.name.trim() &&
        recipe.image &&
        typeof recipe.image === 'string' &&
        recipe.image.trim()
    );
}

/**
 * Validates ingredient array format
 *
 * @param ingredients - Array of ingredient strings to validate
 * @returns Validation result with any issues found
 *
 * @example
 * ```typescript
 * validateIngredients(['2 cups flour', 'salt'])
 * // { valid: true, warnings: [] }
 *
 * validateIngredients([])
 * // { valid: false, warnings: [...] }
 * ```
 */
export function validateIngredients(ingredients: string[] | undefined): {
    valid: boolean;
    warnings: ValidationWarning[];
} {
    const warnings: ValidationWarning[] = [];

    if (!ingredients || ingredients.length === 0) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'recipeIngredient',
            message: 'No ingredients found',
            actionable: true,
            severity: 'warning',
        });
        return {valid: false, warnings};
    }

    // Check for very short ingredients (might be incomplete or malformed)
    const shortIngredients = ingredients.filter((ing) => ing.trim().length < 3);
    if (shortIngredients.length > 0) {
        warnings.push({
            type: 'data_quality',
            field: 'recipeIngredient',
            message: `${shortIngredients.length} ingredient(s) are very short and may be incomplete`,
            actionable: true,
            severity: 'warning',
        });
    }

    // Check for suspiciously long ingredients (might include multiple items)
    const longIngredients = ingredients.filter((ing) => ing.length > 200);
    if (longIngredients.length > 0) {
        warnings.push({
            type: 'data_quality',
            field: 'recipeIngredient',
            message: `${longIngredients.length} ingredient(s) are very long and may need splitting`,
            actionable: true,
            severity: 'warning',
        });
    }

    return {valid: true, warnings};
}

/**
 * Validates instructions array format
 *
 * @param instructions - Array of instruction strings to validate
 * @returns Validation result with any issues found
 *
 * @example
 * ```typescript
 * validateInstructions(['Mix ingredients', 'Bake at 350F'])
 * // { valid: true, warnings: [] }
 * ```
 */
export function validateInstructions(instructions: string[] | undefined): {
    valid: boolean;
    warnings: ValidationWarning[];
} {
    const warnings: ValidationWarning[] = [];

    if (!instructions || instructions.length === 0) {
        warnings.push({
            type: 'missing_optional_field',
            field: 'recipeInstructions',
            message: 'No instructions found',
            actionable: true,
            severity: 'warning',
        });
        return {valid: false, warnings};
    }

    // Check for very short instructions (might be incomplete)
    const shortInstructions = instructions.filter((inst) => inst.trim().length < 5);
    if (shortInstructions.length > 0) {
        warnings.push({
            type: 'data_quality',
            field: 'recipeInstructions',
            message: `${shortInstructions.length} instruction(s) are very short and may be incomplete`,
            actionable: true,
            severity: 'warning',
        });
    }

    return {valid: true, warnings};
}

/**
 * Creates a validation error object
 *
 * @param type - Error type
 * @param field - Field name
 * @param message - User-facing message
 * @param details - Optional technical details
 * @returns ValidationError object
 */
export function createValidationError(
    type: ValidationError['type'],
    field: string,
    message: string,
    details?: string
): ValidationError {
    return {
        type,
        field,
        message,
        details,
        severity: 'error',
    };
}

/**
 * Creates a validation warning object
 *
 * @param type - Warning type
 * @param field - Field name
 * @param message - User-facing message
 * @param actionable - Whether user can fix this
 * @returns ValidationWarning object
 */
export function createValidationWarning(
    type: ValidationWarning['type'],
    field: string,
    message: string,
    actionable: boolean = true
): ValidationWarning {
    return {
        type,
        field,
        message,
        actionable,
        severity: 'warning',
    };
}
