/**
 * Ingredient formatting utilities
 * Provides functions to format parsed ingredients for display and storage
 * @module utils/ingredients/formatter
 */

import type { ParsedIngredient } from '@/models/ParsedIngredient';

/**
 * Formatting options for ingredient display
 */
export interface IngredientFormatOptions {
  /** Include metric conversion in output */
  includeMetric?: boolean;

  /** Include preparation notes in output */
  includePreparation?: boolean;

  /** Format style: 'display' for UI, 'storage' for database */
  format?: 'display' | 'storage';
}

/**
 * Formats a parsed ingredient back to a string representation
 *
 * @param ingredient - Parsed ingredient object
 * @param options - Formatting options
 * @returns Formatted ingredient string
 *
 * @example
 * ```typescript
 * const ingredient: ParsedIngredient = {
 *   originalText: '2 cups flour',
 *   quantity: '2',
 *   unit: 'cups',
 *   ingredientName: 'all-purpose flour',
 *   preparationNotes: 'sifted',
 *   metricQuantity: '240',
 *   metricUnit: 'g',
 *   confidence: 0.95,
 *   requiresManualReview: false,
 *   parsingMethod: 'ai'
 * };
 *
 * formatIngredient(ingredient)
 * // '2 cups all-purpose flour, sifted'
 *
 * formatIngredient(ingredient, { includeMetric: true })
 * // '2 cups (240g) all-purpose flour, sifted'
 * ```
 */
export function formatIngredient(
  ingredient: ParsedIngredient,
  options: IngredientFormatOptions = {}
): string {
  const parts: string[] = [];

  // Add quantity and unit
  if (ingredient.quantity) {
    parts.push(ingredient.quantity);
  }
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  // Add metric conversion in parentheses if requested
  if (
    options.includeMetric &&
    ingredient.metricQuantity &&
    ingredient.metricUnit
  ) {
    parts.push(`(${ingredient.metricQuantity}${ingredient.metricUnit})`);
  }

  // Add ingredient name
  parts.push(ingredient.ingredientName);

  // Build base string
  let formatted = parts.join(' ');

  // Add preparation notes if requested and available
  if (
    options.includePreparation !== false &&
    ingredient.preparationNotes
  ) {
    formatted += `, ${ingredient.preparationNotes}`;
  }

  return formatted;
}

/**
 * Formats an array of parsed ingredients
 *
 * @param ingredients - Array of parsed ingredients
 * @param options - Formatting options
 * @returns Array of formatted strings
 *
 * @example
 * ```typescript
 * const formatted = formatIngredients(parsedIngredients, {
 *   includeMetric: true
 * });
 * ```
 */
export function formatIngredients(
  ingredients: ParsedIngredient[],
  options: IngredientFormatOptions = {}
): string[] {
  return ingredients.map((ingredient) => formatIngredient(ingredient, options));
}

/**
 * Formats ingredient for display in UI
 * Shows metric conversion and preparation notes by default
 *
 * @param ingredient - Parsed ingredient
 * @returns Display-formatted string
 *
 * @example
 * ```typescript
 * formatIngredientForDisplay(ingredient)
 * // '2 cups (240g) all-purpose flour, sifted'
 * ```
 */
export function formatIngredientForDisplay(ingredient: ParsedIngredient): string {
  return formatIngredient(ingredient, {
    includeMetric: true,
    includePreparation: true,
    format: 'display',
  });
}

/**
 * Formats ingredient for storage/export
 * Uses original text if parsing method is manual, otherwise formats parsed data
 *
 * @param ingredient - Parsed ingredient
 * @returns Storage-formatted string
 *
 * @example
 * ```typescript
 * formatIngredientForStorage(ingredient)
 * // Uses originalText for manual parsing, formatted string for AI parsing
 * ```
 */
export function formatIngredientForStorage(ingredient: ParsedIngredient): string {
  // For manually entered ingredients, prefer original text
  if (ingredient.parsingMethod === 'manual' || ingredient.parsingMethod === 'user') {
    return ingredient.originalText;
  }

  // For AI-parsed ingredients, use formatted version
  return formatIngredient(ingredient, {
    includeMetric: false,
    includePreparation: true,
    format: 'storage',
  });
}

/**
 * Formats metric conversion as a standalone string
 *
 * @param ingredient - Parsed ingredient with metric data
 * @returns Metric conversion string or null if not available
 *
 * @example
 * ```typescript
 * formatMetricConversion(ingredient) // '240g'
 * formatMetricConversion(ingredientNoMetric) // null
 * ```
 */
export function formatMetricConversion(ingredient: ParsedIngredient): string | null {
  if (!ingredient.metricQuantity || !ingredient.metricUnit) {
    return null;
  }

  return `${ingredient.metricQuantity}${ingredient.metricUnit}`;
}

/**
 * Creates a display label for ingredient parsing confidence
 *
 * @param confidence - Confidence score (0-1)
 * @returns Confidence label
 *
 * @example
 * ```typescript
 * formatConfidenceLabel(0.95) // 'High'
 * formatConfidenceLabel(0.75) // 'Medium'
 * formatConfidenceLabel(0.60) // 'Low'
 * ```
 */
export function formatConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.7) return 'Medium';
  return 'Low';
}

/**
 * Creates a badge color for confidence level
 *
 * @param confidence - Confidence score (0-1)
 * @returns Color name for badge (Chakra UI colors)
 *
 * @example
 * ```typescript
 * getConfidenceBadgeColor(0.95) // 'green'
 * getConfidenceBadgeColor(0.75) // 'yellow'
 * getConfidenceBadgeColor(0.60) // 'red'
 * ```
 */
export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.85) return 'green';
  if (confidence >= 0.7) return 'yellow';
  return 'red';
}

/**
 * Parses a formatted ingredient string back to components
 * Useful for manual edits and round-trip conversion
 *
 * @param ingredientText - Formatted ingredient string
 * @returns Partial ParsedIngredient object
 *
 * @example
 * ```typescript
 * parseIngredientString('2 cups flour, sifted')
 * // {
 * //   originalText: '2 cups flour, sifted',
 * //   quantity: '2',
 * //   unit: 'cups',
 * //   ingredientName: 'flour',
 * //   preparationNotes: 'sifted',
 * //   ...
 * // }
 * ```
 */
export function parseIngredientString(ingredientText: string): Partial<ParsedIngredient> {
  // Simple regex-based parsing for basic formats
  // This is a fallback and not as robust as AI parsing

  // Split by comma to separate ingredient from preparation notes
  const [mainPart, preparationNotes] = ingredientText.split(',').map((s) => s.trim());

  // Match quantity, unit, and ingredient name
  // Example: "2 cups all-purpose flour"
  const match = mainPart.match(/^([\d\s/.-]+)?\s*([a-zA-Z]+)?\s+(.+)$/);

  if (match) {
    const [, quantity, unit, ingredientName] = match;
    return {
      originalText: ingredientText,
      quantity: quantity?.trim() || null,
      unit: unit?.trim() || null,
      ingredientName: ingredientName.trim(),
      preparationNotes: preparationNotes || null,
      metricQuantity: null,
      metricUnit: null,
      confidence: 0.5, // Low confidence for manual parsing
      requiresManualReview: true,
      parsingMethod: 'manual',
    };
  }

  // If parsing fails, return basic structure
  return {
    originalText: ingredientText,
    quantity: null,
    unit: null,
    ingredientName: mainPart,
    preparationNotes: preparationNotes || null,
    metricQuantity: null,
    metricUnit: null,
    confidence: 0.5,
    requiresManualReview: true,
    parsingMethod: 'manual',
  };
}

/**
 * Creates a new ParsedIngredient from a raw string
 * Used for manually added ingredients that haven't been AI-parsed
 *
 * @param rawText - Raw ingredient text
 * @returns ParsedIngredient object with manual parsing
 *
 * @example
 * ```typescript
 * const ingredient = createManualParsedIngredient('2 cups flour');
 * // Returns a ParsedIngredient with parsingMethod: 'manual'
 * ```
 */
export function createManualParsedIngredient(rawText: string): ParsedIngredient {
  const partial = parseIngredientString(rawText);

  return {
    originalText: rawText,
    quantity: partial.quantity || null,
    unit: partial.unit || null,
    ingredientName: partial.ingredientName || rawText,
    preparationNotes: partial.preparationNotes || null,
    metricQuantity: null,
    metricUnit: null,
    confidence: 1.0, // Manual entries are considered "confident"
    requiresManualReview: false, // User entered it manually
    parsingMethod: 'manual',
  };
}

/**
 * Checks if ingredient has metric conversion data
 *
 * @param ingredient - Parsed ingredient
 * @returns True if metric conversion is available
 *
 * @example
 * ```typescript
 * hasMetricConversion(ingredient) // true if metricQuantity and metricUnit exist
 * ```
 */
export function hasMetricConversion(ingredient: ParsedIngredient): boolean {
  return !!(ingredient.metricQuantity && ingredient.metricUnit);
}

/**
 * Checks if ingredient has preparation notes
 *
 * @param ingredient - Parsed ingredient
 * @returns True if preparation notes exist
 *
 * @example
 * ```typescript
 * hasPreparationNotes(ingredient) // true if preparationNotes is non-null
 * ```
 */
export function hasPreparationNotes(ingredient: ParsedIngredient): boolean {
  return !!ingredient.preparationNotes;
}

/**
 * Groups ingredients by parsing method
 *
 * @param ingredients - Array of parsed ingredients
 * @returns Object with ingredients grouped by parsing method
 *
 * @example
 * ```typescript
 * const grouped = groupIngredientsByMethod(allIngredients);
 * console.log(grouped.ai.length); // Number of AI-parsed ingredients
 * console.log(grouped.manual.length); // Number of manually entered ingredients
 * ```
 */
export function groupIngredientsByMethod(ingredients: ParsedIngredient[]): Record<string, ParsedIngredient[]> {
  return ingredients.reduce((groups, ingredient) => {
    const method = ingredient.parsingMethod;
    if (!groups[method]) {
      groups[method] = [];
    }
    groups[method].push(ingredient);
    return groups;
  }, {} as Record<string, ParsedIngredient[]>);
}

/**
 * Filters ingredients that require manual review
 *
 * @param ingredients - Array of parsed ingredients
 * @returns Array of ingredients that need review
 *
 * @example
 * ```typescript
 * const needsReview = getIngredientsNeedingReview(allIngredients);
 * // Returns ingredients with requiresManualReview: true
 * ```
 */
export function getIngredientsNeedingReview(ingredients: ParsedIngredient[]): ParsedIngredient[] {
  return ingredients.filter((ing) => ing.requiresManualReview);
}
