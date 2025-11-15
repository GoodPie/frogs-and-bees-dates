/**
 * Unit tests for ingredient formatter utilities
 * Tests round-trip formatting and conversion of ParsedIngredient objects
 * @module utils/ingredients/formatter.test
 */

import {describe, it, expect} from 'vitest';
import {
    formatIngredient,
    formatIngredients,
    formatIngredientForDisplay,
    formatIngredientForStorage,
    formatMetricConversion,
    formatConfidenceLabel,
    getConfidenceBadgeColor,
    parseIngredientString,
    createManualParsedIngredient,
    hasMetricConversion,
    hasPreparationNotes,
    groupIngredientsByMethod,
    getIngredientsNeedingReview,
} from './formatter';
import {ParsedIngredient} from "../../../../models/ParsedIngredient";

describe('formatIngredient', () => {
    it('should format basic ingredient with quantity and unit', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(ingredient);
        expect(formatted).toBe('2 cups flour');
    });

    it('should format ingredient with preparation notes', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour, sifted',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: 'sifted',
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(ingredient);
        expect(formatted).toBe('2 cups flour, sifted');
    });

    it('should format ingredient with metric conversion when requested', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(ingredient, {includeMetric: true});
        expect(formatted).toBe('2 cups (240g) flour');
    });

    it('should format ingredient without quantity/unit', () => {
        const ingredient: ParsedIngredient = {
            originalText: 'Salt to taste',
            quantity: null,
            unit: null,
            ingredientName: 'Salt',
            preparationNotes: 'to taste',
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.6,
            requiresManualReview: true,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(ingredient);
        expect(formatted).toBe('Salt, to taste');
    });

    it('should exclude preparation notes when requested', () => {
        const ingredient: ParsedIngredient = {
            originalText: '1 egg, beaten',
            quantity: '1',
            unit: null,
            ingredientName: 'egg',
            preparationNotes: 'beaten',
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.95,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(ingredient, {includePreparation: false});
        expect(formatted).toBe('1 egg');
    });
});

describe('formatIngredients', () => {
    it('should format array of ingredients', () => {
        const ingredients: ParsedIngredient[] = [
            {
                originalText: '2 cups flour',
                quantity: '2',
                unit: 'cups',
                ingredientName: 'flour',
                preparationNotes: null,
                metricQuantity: '240',
                metricUnit: 'g',
                confidence: 0.9,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
            {
                originalText: '1 cup sugar',
                quantity: '1',
                unit: 'cup',
                ingredientName: 'sugar',
                preparationNotes: null,
                metricQuantity: '200',
                metricUnit: 'g',
                confidence: 0.92,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
        ];

        const formatted = formatIngredients(ingredients);
        expect(formatted).toHaveLength(2);
        expect(formatted[0]).toBe('2 cups flour');
        expect(formatted[1]).toBe('1 cup sugar');
    });

    it('should apply options to all ingredients', () => {
        const ingredients: ParsedIngredient[] = [
            {
                originalText: '2 cups flour',
                quantity: '2',
                unit: 'cups',
                ingredientName: 'flour',
                preparationNotes: null,
                metricQuantity: '240',
                metricUnit: 'g',
                confidence: 0.9,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
        ];

        const formatted = formatIngredients(ingredients, {includeMetric: true});
        expect(formatted[0]).toBe('2 cups (240g) flour');
    });
});

describe('formatIngredientForDisplay', () => {
    it('should include metric conversion and preparation notes', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour, sifted',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: 'sifted',
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredientForDisplay(ingredient);
        expect(formatted).toBe('2 cups (240g) flour, sifted');
    });
});

describe('formatIngredientForStorage', () => {
    it('should use original text for manual parsing method', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups of flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 1.0,
            requiresManualReview: false,
            parsingMethod: 'manual',
        };

        const formatted = formatIngredientForStorage(ingredient);
        expect(formatted).toBe('2 cups of flour');
    });

    it('should use formatted string for AI parsing method', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: 'sifted',
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.95,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredientForStorage(ingredient);
        expect(formatted).toBe('2 cups flour, sifted');
        expect(formatted).not.toContain('240g'); // Should not include metric in storage
    });
});

describe('formatMetricConversion', () => {
    it('should format metric conversion string', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const metric = formatMetricConversion(ingredient);
        expect(metric).toBe('240g');
    });

    it('should return null when metric conversion not available', () => {
        const ingredient: ParsedIngredient = {
            originalText: '1 egg',
            quantity: '1',
            unit: null,
            ingredientName: 'egg',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.95,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const metric = formatMetricConversion(ingredient);
        expect(metric).toBeNull();
    });
});

describe('formatConfidenceLabel', () => {
    it('should return "High" for confidence >= 0.85', () => {
        expect(formatConfidenceLabel(0.95)).toBe('High');
        expect(formatConfidenceLabel(0.85)).toBe('High');
    });

    it('should return "Medium" for confidence >= 0.7 and < 0.85', () => {
        expect(formatConfidenceLabel(0.8)).toBe('Medium');
        expect(formatConfidenceLabel(0.7)).toBe('Medium');
    });

    it('should return "Low" for confidence < 0.7', () => {
        expect(formatConfidenceLabel(0.65)).toBe('Low');
        expect(formatConfidenceLabel(0.5)).toBe('Low');
    });
});

describe('getConfidenceBadgeColor', () => {
    it('should return "green" for high confidence', () => {
        expect(getConfidenceBadgeColor(0.95)).toBe('green');
        expect(getConfidenceBadgeColor(0.85)).toBe('green');
    });

    it('should return "yellow" for medium confidence', () => {
        expect(getConfidenceBadgeColor(0.8)).toBe('yellow');
        expect(getConfidenceBadgeColor(0.7)).toBe('yellow');
    });

    it('should return "red" for low confidence', () => {
        expect(getConfidenceBadgeColor(0.65)).toBe('red');
        expect(getConfidenceBadgeColor(0.5)).toBe('red');
    });
});

describe('parseIngredientString - Round-trip formatting', () => {
    it('should parse basic ingredient string', () => {
        const text = '2 cups flour';
        const parsed = parseIngredientString(text);

        expect(parsed.originalText).toBe(text);
        expect(parsed.quantity).toBe('2');
        expect(parsed.unit).toBe('cup');
        expect(parsed.ingredientName).toBe('flour');
        expect(parsed.preparationNotes).toBeNull();
    });

    it('should parse ingredient with preparation notes', () => {
        const text = '2 cups flour, sifted';
        const parsed = parseIngredientString(text);

        expect(parsed.originalText).toBe(text);
        expect(parsed.quantity).toBe('2');
        expect(parsed.unit).toBe('cup');
        expect(parsed.ingredientName).toBe('flour');
        expect(parsed.preparationNotes).toBe('sifted');
    });

    it('should parse fractional quantities', () => {
        const text = '1/2 cup milk';
        const parsed = parseIngredientString(text);

        expect(parsed.quantity).toBe('1/2');
        expect(parsed.unit).toBe('cup');
        expect(parsed.ingredientName).toBe('milk');
    });

    it('should parse ingredient without quantity', () => {
        const text = 'Salt to taste';
        const parsed = parseIngredientString(text);

        expect(parsed.originalText).toBe(text);
        // Note: Simple regex parsing treats "Salt" as unit and "to taste" as ingredient
        // For better parsing, use AI ingredient parser
        expect(parsed.ingredientName).toBe('to taste');
        expect(parsed.unit).toBe('each');  // normalizeUnit('Salt') -> 'each' (unrecognized)
        expect(parsed.parsingMethod).toBe('manual');
    });

    it('should mark parsed strings as manual with low confidence', () => {
        const text = '2 cups flour';
        const parsed = parseIngredientString(text);

        expect(parsed.parsingMethod).toBe('manual');
        expect(parsed.confidence).toBe(0.5);
        expect(parsed.requiresManualReview).toBe(true);
    });
});

describe('Round-trip formatting: format -> parse -> format', () => {
    it('should preserve basic ingredient through round-trip', () => {
        const original: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cup',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        // Format to string (without metric)
        const formatted = formatIngredient(original, {includeMetric: false});
        expect(formatted).toBe('2 cup flour');

        // Parse back
        const parsed = parseIngredientString(formatted);
        expect(parsed.quantity).toBe(original.quantity);
        expect(parsed.unit).toBe(original.unit);
        expect(parsed.ingredientName).toBe(original.ingredientName);
    });

    it('should preserve ingredient with preparation notes through round-trip', () => {
        const original: ParsedIngredient = {
            originalText: '2 cups flour, sifted',
            quantity: '2',
            unit: 'cup',
            ingredientName: 'flour',
            preparationNotes: 'sifted',
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        // Format to string
        const formatted = formatIngredient(original);
        expect(formatted).toBe('2 cup flour, sifted');

        // Parse back
        const parsed = parseIngredientString(formatted);
        expect(parsed.quantity).toBe(original.quantity);
        expect(parsed.unit).toBe(original.unit);
        expect(parsed.ingredientName).toBe(original.ingredientName);
        expect(parsed.preparationNotes).toBe(original.preparationNotes);
    });

    it('should handle complex ingredient names through round-trip', () => {
        const original: ParsedIngredient = {
            originalText: '2 cups all-purpose flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'all-purpose flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.95,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        const formatted = formatIngredient(original);
        const parsed = parseIngredientString(formatted);

        expect(parsed.ingredientName).toBe(original.ingredientName);
    });
});

describe('createManualParsedIngredient', () => {
    it('should create ParsedIngredient from raw text', () => {
        const text = '2 cups flour';
        const ingredient = createManualParsedIngredient(text);

        expect(ingredient.originalText).toBe(text);
        expect(ingredient.quantity).toBe('2');
        expect(ingredient.unit).toBe('cup');
        expect(ingredient.ingredientName).toBe('flour');
        expect(ingredient.parsingMethod).toBe('manual');
        expect(ingredient.confidence).toBe(1.0);
        expect(ingredient.requiresManualReview).toBe(false);
    });

    it('should handle text with preparation notes', () => {
        const text = '2 cups flour, sifted';
        const ingredient = createManualParsedIngredient(text);

        expect(ingredient.preparationNotes).toBe('sifted');
    });
});

describe('hasMetricConversion', () => {
    it('should return true when metric conversion exists', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        expect(hasMetricConversion(ingredient)).toBe(true);
    });

    it('should return false when metric conversion missing', () => {
        const ingredient: ParsedIngredient = {
            originalText: '1 egg',
            quantity: '1',
            unit: null,
            ingredientName: 'egg',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.95,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        expect(hasMetricConversion(ingredient)).toBe(false);
    });
});

describe('hasPreparationNotes', () => {
    it('should return true when preparation notes exist', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour, sifted',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: 'sifted',
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        expect(hasPreparationNotes(ingredient)).toBe(true);
    });

    it('should return false when preparation notes missing', () => {
        const ingredient: ParsedIngredient = {
            originalText: '2 cups flour',
            quantity: '2',
            unit: 'cups',
            ingredientName: 'flour',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.9,
            requiresManualReview: false,
            parsingMethod: 'ai',
        };

        expect(hasPreparationNotes(ingredient)).toBe(false);
    });
});

describe('groupIngredientsByMethod', () => {
    it('should group ingredients by parsing method', () => {
        const ingredients: ParsedIngredient[] = [
            {
                originalText: '2 cups flour',
                quantity: '2',
                unit: 'cups',
                ingredientName: 'flour',
                preparationNotes: null,
                metricQuantity: '240',
                metricUnit: 'g',
                confidence: 0.9,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
            {
                originalText: '1 cup sugar',
                quantity: '1',
                unit: 'cup',
                ingredientName: 'sugar',
                preparationNotes: null,
                metricQuantity: null,
                metricUnit: null,
                confidence: 1.0,
                requiresManualReview: false,
                parsingMethod: 'manual',
            },
            {
                originalText: '1/2 tsp salt',
                quantity: '1/2',
                unit: 'tsp',
                ingredientName: 'salt',
                preparationNotes: null,
                metricQuantity: '2.5',
                metricUnit: 'g',
                confidence: 0.88,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
        ];

        const grouped = groupIngredientsByMethod(ingredients);

        expect(grouped.ai).toHaveLength(2);
        expect(grouped.manual).toHaveLength(1);
        expect(grouped.ai[0].ingredientName).toBe('flour');
        expect(grouped.manual[0].ingredientName).toBe('sugar');
    });
});

describe('getIngredientsNeedingReview', () => {
    it('should filter ingredients that require manual review', () => {
        const ingredients: ParsedIngredient[] = [
            {
                originalText: '2 cups flour',
                quantity: '2',
                unit: 'cups',
                ingredientName: 'flour',
                preparationNotes: null,
                metricQuantity: '240',
                metricUnit: 'g',
                confidence: 0.9,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
            {
                originalText: 'Salt to taste',
                quantity: null,
                unit: null,
                ingredientName: 'Salt',
                preparationNotes: 'to taste',
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.5,
                requiresManualReview: true,
                parsingMethod: 'ai',
            },
        ];

        const needsReview = getIngredientsNeedingReview(ingredients);

        expect(needsReview).toHaveLength(1);
        expect(needsReview[0].ingredientName).toBe('Salt');
    });

    it('should return empty array when no ingredients need review', () => {
        const ingredients: ParsedIngredient[] = [
            {
                originalText: '2 cups flour',
                quantity: '2',
                unit: 'cups',
                ingredientName: 'flour',
                preparationNotes: null,
                metricQuantity: '240',
                metricUnit: 'g',
                confidence: 0.9,
                requiresManualReview: false,
                parsingMethod: 'ai',
            },
        ];

        const needsReview = getIngredientsNeedingReview(ingredients);

        expect(needsReview).toHaveLength(0);
    });
});
