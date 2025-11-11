/**
 * Configuration constants for recipe import feature
 * @module importConfig
 */

/**
 * Ingredient parsing configuration
 */
export const INGREDIENT_PARSING = {
  /** Maximum number of ingredients per batch (Firebase AI Logic limit) */
  MAX_BATCH_SIZE: 20,

  /** Maximum characters per ingredient string */
  MAX_LENGTH: 500,

  /** Confidence threshold for flagging ingredients for review (0.0-1.0) */
  CONFIDENCE_THRESHOLD: 0.7,

  /** Default confidence for manually entered ingredients */
  DEFAULT_CONFIDENCE: 0.5,
} as const;

/**
 * JSON-LD parsing configuration
 */
export const JSON_LD_PARSING = {
  /** Maximum input size in bytes (2MB) */
  MAX_INPUT_SIZE: 2 * 1024 * 1024,

  /** Parsing timeout in milliseconds */
  TIMEOUT_MS: 5000,
} as const;

/**
 * UI behavior configuration
 */
export const UI_CONFIG = {
  /** Parse delay in milliseconds (0 = no artificial delay) */
  PARSE_DELAY_MS: 0,

  /** Debounce delay for input changes in milliseconds */
  DEBOUNCE_MS: 300,
} as const;

/**
 * Complete parsing configuration object
 */
export interface ParsingConfig {
  ingredientParsing: typeof INGREDIENT_PARSING;
  jsonLdParsing: typeof JSON_LD_PARSING;
  ui: typeof UI_CONFIG;
}

/**
 * Default configuration combining all parsing settings
 */
export const DEFAULT_PARSING_CONFIG: ParsingConfig = {
  ingredientParsing: INGREDIENT_PARSING,
  jsonLdParsing: JSON_LD_PARSING,
  ui: UI_CONFIG,
} as const;
