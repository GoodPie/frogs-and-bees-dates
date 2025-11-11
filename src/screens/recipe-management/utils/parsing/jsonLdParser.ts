/**
 * Recipe JSON-LD parsing service
 * Implements RecipeParsingService contract for parsing schema.org Recipe data
 * @module utils/parsing/jsonLdParser
 */

import type { RecipeParseResult } from '@/screens/recipe-management/types/state';
import type { ValidationError } from '@/screens/recipe-management/types/errors';
import { JSON_LD_PARSING } from '@/screens/recipe-management/config/importConfig';
import {
  preprocessJsonInput,
  detectInputFormat,
  validateJson,
  isWithinSizeLimit,
  getByteSize,
} from './preprocessor';
import {
  findRecipeInJsonLd,
  extractAllRecipeFields,
  getJsonLdType,
} from './fieldExtractor';
import { validateRecipe } from './validator';

/**
 * Parsing options for JSON-LD parser
 */
export interface ParseJsonLdOptions {
  /** Source URL for metadata */
  sourceUrl?: string;

  /** Validation mode: 'strict' requires all recommended fields, 'lenient' only requires name and image */
  validationMode?: 'strict' | 'lenient';

  /** Maximum input size in bytes (defaults to config) */
  maxInputSize?: number;

  /** Parsing timeout in milliseconds (defaults to config) */
  timeoutMs?: number;
}

/**
 * Parses schema.org Recipe JSON-LD text into structured recipe data
 *
 * @param jsonLdText - Raw JSON-LD text from user input
 * @param options - Parsing options
 * @returns Recipe parse result with success/failure info
 *
 * @example
 * ```typescript
 * const result = parseRecipeJsonLd(jsonLdText, {
 *   sourceUrl: 'https://example.com/recipe',
 *   validationMode: 'lenient'
 * });
 *
 * if (result.success) {
 *   console.log('Recipe:', result.recipe);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function parseRecipeJsonLd(
  jsonLdText: string,
  options: ParseJsonLdOptions = {}
): RecipeParseResult {
  const startTime = Date.now();
  const maxSize = options.maxInputSize ?? JSON_LD_PARSING.MAX_INPUT_SIZE;

  // Check input size before processing
  if (!isWithinSizeLimit(jsonLdText, maxSize)) {
    const actualSize = getByteSize(jsonLdText);

    return {
      success: false,
      errors: [
        {
          type: 'invalid_format',
          message: `Input too large: ${actualSize} bytes (limit: ${maxSize} bytes)`,
          details: 'Try copying a smaller portion of the JSON-LD or contact support.',
          severity: 'error',
        },
      ],
      warnings: [],
      metadata: {
        parsedAt: new Date(),
        sourceUrl: options.sourceUrl,
        rawJsonLd: jsonLdText,
        parsingDurationMs: Date.now() - startTime,
      },
    };
  }

  // Preprocess the input
  const preprocessed = preprocessJsonInput(jsonLdText);

  // Validate JSON structure
  const jsonValidation = validateJson(preprocessed);
  if (!jsonValidation.valid) {
    // Detect input format to provide better error message
    const { isEscaped, hint } = detectInputFormat(jsonLdText);

    const errorMessages: string[] = ['Invalid JSON format. Please check your input.'];

    if (isEscaped && hint) {
      errorMessages.push(hint);
      errorMessages.push('Try copying the raw JSON content instead of the console output.');
    } else {
      errorMessages.push('Make sure you copied the complete JSON structure with all opening and closing brackets.');
      errorMessages.push('Verify there are no syntax errors like trailing commas or unescaped quotes.');
    }

    const validationErrors: ValidationError[] = [
      {
        type: 'invalid_format',
        message: errorMessages.join(' '),
        details: jsonValidation.error,
        severity: 'error',
      },
    ];

    if (jsonValidation.line) {
      validationErrors[0].details = `${jsonValidation.error} at line ${jsonValidation.line}`;
    }

    return {
      success: false,
      errors: validationErrors,
      warnings: [],
      metadata: {
        parsedAt: new Date(),
        sourceUrl: options.sourceUrl,
        rawJsonLd: jsonLdText,
        parsingDurationMs: Date.now() - startTime,
      },
    };
  }

  // Find Recipe in JSON-LD data
  const recipeData = findRecipeInJsonLd(jsonValidation.data);

  if (!recipeData) {
    // Get the actual type if available
    const actualType = getJsonLdType(jsonValidation.data);

    return {
      success: false,
      errors: [
        {
          type: 'schema_mismatch',
          message: 'No Recipe schema found in JSON-LD',
          details: actualType
            ? `Expected Recipe schema but found ${actualType}. Make sure you're copying the recipe JSON-LD data.`
            : 'Please ensure the data contains a Recipe type with @type: "Recipe".',
          severity: 'error',
        },
      ],
      warnings: [],
      metadata: {
        parsedAt: new Date(),
        sourceUrl: options.sourceUrl,
        rawJsonLd: jsonLdText,
        parsingDurationMs: Date.now() - startTime,
      },
    };
  }

  // Extract all recipe fields
  const recipe = extractAllRecipeFields(recipeData);

  // Validate recipe data
  const validation = validateRecipe(recipe);

  // In lenient mode, only fail on required field errors
  const criticalErrors =
    options.validationMode === 'lenient'
      ? validation.errors
      : validation.errors;

  return {
    success: criticalErrors.length === 0,
    recipe: validation.isValid || options.validationMode === 'lenient' ? recipe : undefined,
    errors: criticalErrors,
    warnings: validation.warnings,
    metadata: {
      parsedAt: new Date(),
      sourceUrl: options.sourceUrl,
      rawJsonLd: jsonLdText,
      parsingDurationMs: Date.now() - startTime,
    },
  };
}

/**
 * Generates instructions for extracting JSON-LD from a webpage
 *
 * @param url - Optional URL of the recipe webpage
 * @returns Formatted instructions for users
 *
 * @example
 * ```typescript
 * const instructions = getJsonLdExtractionInstructions('https://example.com/recipe');
 * console.log(instructions); // Multi-line instructions with console snippets
 * ```
 */
export function getJsonLdExtractionInstructions(url?: string): string {
  const urlPart = url
    ? `\n1. Open ${url} in your browser`
    : '\n1. Open the recipe webpage in your browser';

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

/**
 * Recipe parsing service factory
 * Creates a service instance with the RecipeParsingService interface
 *
 * @returns Recipe parsing service instance
 *
 * @example
 * ```typescript
 * const service = createRecipeParsingService();
 * const result = service.parseJsonLd(jsonLdText, { validationMode: 'lenient' });
 * ```
 */
export function createRecipeParsingService(): RecipeParsingService {
  return {
    parseJsonLd: parseRecipeJsonLd,
    getExtractionInstructions: getJsonLdExtractionInstructions,
    preprocessInput: preprocessJsonInput,
    validateJson,
  };
}

/**
 * Type for the recipe parsing service
 */
export interface RecipeParsingService {
  parseJsonLd(jsonLdText: string, options?: ParseJsonLdOptions): RecipeParseResult;
  getExtractionInstructions(url?: string): string;
  preprocessInput(input: string): string;
  validateJson(input: string): ReturnType<typeof validateJson>;
}
