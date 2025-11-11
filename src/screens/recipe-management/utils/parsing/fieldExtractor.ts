/**
 * Field extraction utilities for schema.org Recipe JSON-LD
 * Handles various schema.org formats and normalizes data
 * @module utils/parsing/fieldExtractor
 */

import type { SchemaOrgRecipe, IRecipe, IRecipeNutrition } from '@/screens/recipe-management/types/Recipe';

/**
 * Extracts image URL from various schema.org image formats
 *
 * @param image - Schema.org image field (string, array, or object)
 * @returns Image URL or empty string if not found
 *
 * @example
 * ```typescript
 * extractImageUrl('https://example.com/image.jpg') // 'https://example.com/image.jpg'
 * extractImageUrl(['url1.jpg', 'url2.jpg']) // 'url1.jpg'
 * extractImageUrl([{ url: 'image.jpg' }]) // 'image.jpg'
 * ```
 */
export function extractImageUrl(image: string | string[] | { url: string }[] | undefined): string {
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
    if (typeof first === 'object' && first !== null && 'url' in first) {
      return first.url;
    }
  }

  return '';
}

/**
 * Extracts instructions from various schema.org formats
 * Handles HowToStep objects with optional names
 *
 * @param instructions - Schema.org instructions field
 * @returns Array of instruction strings
 *
 * @example
 * ```typescript
 * extractInstructions(['Step 1', 'Step 2']) // ['Step 1', 'Step 2']
 * extractInstructions([{ text: 'Mix flour' }]) // ['Mix flour']
 * extractInstructions([{ name: 'Mix', text: 'Mix flour' }]) // ['Mix: Mix flour']
 * ```
 */
export function extractInstructions(
  instructions: string[] | { text: string }[] | { name?: string; text: string }[] | undefined
): string[] {
  if (!instructions) return [];

  if (Array.isArray(instructions)) {
    return instructions
      .map((instruction) => {
        if (typeof instruction === 'string') {
          return instruction;
        }
        if (typeof instruction === 'object' && instruction !== null && 'text' in instruction) {
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
      })
      .filter((i) => i.trim() !== '');
  }

  return [];
}

/**
 * Converts schema.org author format to string
 *
 * @param author - Schema.org author field (string or object)
 * @returns Author name or undefined
 *
 * @example
 * ```typescript
 * extractAuthor('John Doe') // 'John Doe'
 * extractAuthor({ name: 'Jane Smith' }) // 'Jane Smith'
 * extractAuthor(undefined) // undefined
 * ```
 */
export function extractAuthor(author: { name: string } | string | undefined): string | undefined {
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
 * Converts nutrition information, removing units and parsing values
 *
 * @param nutrition - Schema.org nutrition object
 * @returns Normalized nutrition data or undefined
 *
 * @example
 * ```typescript
 * extractNutrition({ calories: '270 calories' })
 * // { calories: '270' }
 *
 * extractNutrition({ calories: '14g' })
 * // { calories: '14' }
 * ```
 */
export function extractNutrition(nutrition: SchemaOrgRecipe['nutrition']): IRecipeNutrition | undefined {
  if (!nutrition) return undefined;

  const result: IRecipeNutrition = {
    calories: parseNutritionValue(nutrition.calories),
  };

  // Only return if at least one value exists
  return Object.values(result).some((v) => v) ? result : undefined;
}

/**
 * Parses numeric value from nutrition strings, removing units
 * Examples: "270 calories" -> "270", "14g" -> "14"
 *
 * @param value - Nutrition value string with optional units
 * @returns Numeric string or undefined
 *
 * @example
 * ```typescript
 * parseNutritionValue('270 calories') // '270'
 * parseNutritionValue('14g') // '14'
 * parseNutritionValue('15.5 oz') // '15.5'
 * parseNutritionValue(undefined) // undefined
 * ```
 */
export function parseNutritionValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Extract the numeric portion (including decimals)
  const match = value.match(/[\d.]+/);
  return match ? match[0] : undefined;
}

/**
 * Ensures value is an array
 *
 * @param value - String, array, or undefined
 * @returns Array (empty if undefined, wrapped if string)
 *
 * @example
 * ```typescript
 * ensureArray('dinner') // ['dinner']
 * ensureArray(['dinner', 'main']) // ['dinner', 'main']
 * ensureArray(undefined) // []
 * ```
 */
export function ensureArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Finds Recipe object in JSON-LD data
 * Handles @graph wrapper and arrays
 *
 * @param jsonData - Parsed JSON-LD data
 * @returns Recipe object or undefined if not found
 *
 * @example
 * ```typescript
 * // Direct recipe
 * findRecipeInJsonLd({ '@type': 'Recipe', name: 'Soup' })
 * // Returns the recipe object
 *
 * // @graph wrapper
 * findRecipeInJsonLd({ '@graph': [{ '@type': 'Recipe', name: 'Soup' }] })
 * // Returns the recipe object
 *
 * // Array of objects
 * findRecipeInJsonLd([{ '@type': 'Recipe', name: 'Soup' }])
 * // Returns the recipe object
 * ```
 */
export function findRecipeInJsonLd(jsonData: unknown): SchemaOrgRecipe | undefined {
  // Handle array of objects - find Recipe type
  if (Array.isArray(jsonData)) {
    return jsonData.find((item: unknown) => {
      if (typeof item === 'object' && item !== null && '@type' in item) {
        const type = (item as { '@type': string | string[] })['@type'];
        return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
      }
      return false;
    }) as SchemaOrgRecipe | undefined;
  }

  // Handle object
  if (typeof jsonData === 'object' && jsonData !== null) {
    const obj = jsonData as Record<string, unknown>;

    // Handle @graph wrapper (some sites use this)
    if ('@graph' in obj && Array.isArray(obj['@graph'])) {
      return obj['@graph'].find((item: unknown) => {
        if (typeof item === 'object' && item !== null && '@type' in item) {
          const type = (item as { '@type': string | string[] })['@type'];
          return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
        }
        return false;
      }) as SchemaOrgRecipe | undefined;
    }

    // Direct Recipe object
    if ('@type' in obj) {
      const type = obj['@type'];
      if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
        return obj as SchemaOrgRecipe;
      }
    }
  }

  return undefined;
}

/**
 * Extracts all fields from schema.org Recipe to IRecipe format
 *
 * @param recipeData - Schema.org Recipe object
 * @returns Partial IRecipe with all extracted fields
 *
 * @example
 * ```typescript
 * const schemaRecipe = {
 *   '@type': 'Recipe',
 *   name: 'Chocolate Cake',
 *   image: 'cake.jpg',
 *   recipeIngredient: ['flour', 'sugar'],
 *   // ... other fields
 * };
 *
 * const recipe = extractAllRecipeFields(schemaRecipe);
 * console.log(recipe.name); // 'Chocolate Cake'
 * ```
 */
export function extractAllRecipeFields(recipeData: SchemaOrgRecipe): Partial<IRecipe> {
  return {
    name: recipeData.name?.trim() || '',
    image: extractImageUrl(recipeData.image),
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
}

/**
 * Gets @type value from JSON-LD object
 *
 * @param jsonData - JSON-LD object
 * @returns Type string or undefined
 *
 * @example
 * ```typescript
 * getJsonLdType({ '@type': 'Recipe' }) // 'Recipe'
 * getJsonLdType({ '@type': ['Recipe', 'Thing'] }) // 'Recipe'
 * ```
 */
export function getJsonLdType(jsonData: unknown): string | undefined {
  if (typeof jsonData === 'object' && jsonData !== null && '@type' in jsonData) {
    const type = (jsonData as { '@type': string | string[] })['@type'];
    if (typeof type === 'string') {
      return type;
    }
    if (Array.isArray(type) && type.length > 0) {
      return type[0]; // Return first type
    }
  }
  return undefined;
}

/**
 * Checks if JSON-LD object is a Recipe type
 *
 * @param jsonData - JSON-LD object to check
 * @returns True if object is Recipe type
 *
 * @example
 * ```typescript
 * isRecipeType({ '@type': 'Recipe' }) // true
 * isRecipeType({ '@type': ['Recipe', 'Thing'] }) // true
 * isRecipeType({ '@type': 'Article' }) // false
 * ```
 */
export function isRecipeType(jsonData: unknown): boolean {
  if (typeof jsonData === 'object' && jsonData !== null && '@type' in jsonData) {
    const type = (jsonData as { '@type': string | string[] })['@type'];
    return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
  }
  return false;
}
