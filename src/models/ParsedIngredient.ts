/**
 * Parsed ingredient with structured components and metric conversion
 *
 * This model represents a single ingredient that has been parsed from an unstructured
 * string into structured components (quantity, unit, name) with automatic metric conversion
 * for imperial measurements.
 *
 * @example
 * ```typescript
 * const ingredient: ParsedIngredient = {
 *   originalText: "2 cups all-purpose flour, sifted",
 *   quantity: "2",
 *   unit: "cups",
 *   ingredientName: "all-purpose flour",
 *   preparationNotes: "sifted",
 *   metricQuantity: "240",
 *   metricUnit: "g",
 *   confidence: 0.95,
 *   requiresManualReview: false
 * };
 * ```
 */
export interface ParsedIngredient {
  /**
   * The raw ingredient string as imported
   * @example "2 cups all-purpose flour"
   */
  originalText: string;

  /**
   * Numeric quantity extracted from the ingredient
   * Stored as string to preserve fractions, ranges, and special values
   * @example "2", "1/2", "2-3"
   * @nullable No quantity specified (e.g., "Salt to taste")
   */
  quantity: string | null;

  /**
   * Measurement unit
   * @example "cup", "tsp", "oz", "g", "ml"
   * @nullable No unit specified
   */
  unit: string | null;

  /**
   * The ingredient name without quantity/unit
   * @example "all-purpose flour", "butter", "salt"
   */
  ingredientName: string;

  /**
   * Additional instructions or modifiers
   * @example "chopped", "softened", "room temperature", "sifted"
   * @nullable No preparation notes
   */
  preparationNotes: string | null;

  /**
   * Converted metric quantity
   * Stored as string to preserve decimal precision
   * @example "240" (for 2 cups flour), "473" (for 2 cups liquid)
   * @nullable Already metric or conversion not applicable
   */
  metricQuantity: string | null;

  /**
   * Converted metric unit
   * @example "ml", "g", "kg", "l"
   * @nullable Already metric or conversion not applicable
   */
  metricUnit: string | null;

  /**
   * Parsing confidence score from 0-1
   * Higher values indicate more confident parsing
   * @example 0.95 for standard formats, 0.5 for ambiguous ingredients
   */
  confidence: number;

  /**
   * Flag indicating if user should review/edit this ingredient
   * Set to true for low confidence (<0.7) or parsing failures
   */
  requiresManualReview: boolean;
}

/**
 * Validation helper for ParsedIngredient
 */
export function validateParsedIngredient(ingredient: ParsedIngredient): boolean {
  // originalText must not be empty
  if (!ingredient.originalText || ingredient.originalText.trim().length === 0) {
    return false;
  }

  // ingredientName must be at least 2 characters
  if (!ingredient.ingredientName || ingredient.ingredientName.trim().length < 2) {
    return false;
  }

  // confidence must be between 0 and 1
  if (ingredient.confidence < 0 || ingredient.confidence > 1) {
    return false;
  }

  // If metricQuantity is set, metricUnit must also be set
  if (ingredient.metricQuantity !== null && ingredient.metricUnit === null) {
    return false;
  }

  return true;
}
