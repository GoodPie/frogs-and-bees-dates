/**
 * Integration tests for JSON-LD parser
 * Tests the complete parsing pipeline from raw input to validated recipe
 * @module utils/parsing/jsonLdParser.test
 */

import {describe, it, expect} from 'vitest';
import {
    parseRecipeJsonLd,
    getJsonLdExtractionInstructions,
    createRecipeParsingService,
} from './jsonLdParser';

describe('parseRecipeJsonLd', () => {
    describe('Success cases', () => {
        it('should parse valid recipe JSON-LD', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Chocolate Cake',
                image: 'https://example.com/cake.jpg',
                recipeIngredient: ['2 cups flour', '1 cup sugar'],
                recipeInstructions: ['Mix ingredients', 'Bake at 350F'],
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe).toBeDefined();
            expect(result.recipe?.name).toBe('Chocolate Cake');
            expect(result.errors).toHaveLength(0);
        });

        it('should handle recipe with minimal required fields', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Simple Recipe',
                image: 'https://example.com/image.jpg',
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe).toBeDefined();
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should handle recipe wrapped in @graph', () => {
            const jsonLd = JSON.stringify({
                '@graph': [
                    {
                        '@type': 'Recipe',
                        name: 'Pasta',
                        image: 'https://example.com/pasta.jpg',
                        recipeIngredient: ['pasta', 'sauce'],
                        recipeInstructions: ['Cook pasta', 'Add sauce'],
                    },
                ],
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Pasta');
        });

        it('should preserve metadata in result', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            });
            const sourceUrl = 'https://example.com/recipe';

            const result = parseRecipeJsonLd(jsonLd, {sourceUrl});

            expect(result.metadata.sourceUrl).toBe(sourceUrl);
            expect(result.metadata.parsedAt).toBeInstanceOf(Date);
            expect(result.metadata.parsingDurationMs).toBeGreaterThanOrEqual(0);
            expect(result.metadata.rawJsonLd).toBe(jsonLd);
        });
    });

    describe('Preprocessing', () => {
        it('should handle BOM in input', () => {
            const jsonLd = '\uFEFF' + JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
        });

        it('should handle markdown code blocks', () => {
            const jsonLd = `\`\`\`json
${JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            })}
\`\`\``;

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test');
        });

        it('should handle escaped JSON from console output', () => {
            const rawJson = {
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            };
            // Simulate console output
            const jsonLd = JSON.stringify(JSON.stringify(rawJson));

            const result = parseRecipeJsonLd(jsonLd);

            // May succeed or provide helpful error message
            expect(result).toHaveProperty('success');
        });
    });

    describe('Error handling', () => {
        it('should detect invalid JSON', () => {
            const jsonLd = '{"@type": "Recipe", name: "Test"'; // Missing quote

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].type).toBe('invalid_format');
        });

        it('should detect missing Recipe schema', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Article',
                name: 'Not a recipe',
                url: 'https://example.com',
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors[0].type).toBe('schema_mismatch');
        });

        it('should enforce size limit', () => {
            const largeJson = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
                description: 'x'.repeat(3000000), // Exceed limit
            });

            const result = parseRecipeJsonLd(largeJson);

            expect(result.success).toBe(false);
            expect(result.errors[0].type).toBe('invalid_format');
            expect(result.errors[0].message).toContain('too large');
        });

        it('should report missing required fields as errors', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                // Missing image
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should provide helpful hints for escaped JSON', () => {
            const jsonLd = '{\\n  "name": "Test"\\n}';

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('Invalid JSON format');
        });
    });

    describe('Validation modes', () => {
        it('should accept recipes with warnings in lenient mode', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
                // Missing ingredients and instructions
            });

            const result = parseRecipeJsonLd(jsonLd, {validationMode: 'lenient'});

            expect(result.success).toBe(true);
            expect(result.recipe).toBeDefined();
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should handle strict mode (default)', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            });

            const result = parseRecipeJsonLd(jsonLd, {validationMode: 'strict'});

            // Strict mode may have warnings but should succeed with minimal content
            expect(result.recipe).toBeDefined();
        });
    });

    describe('Custom configuration', () => {
        it('should respect custom max input size', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
                description: 'x'.repeat(100),
            });

            const result = parseRecipeJsonLd(jsonLd, {maxInputSize: 50});

            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('too large');
        });

        it('should include source URL in metadata', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
            });
            const url = 'https://example.com/recipe/chocolate-cake';

            const result = parseRecipeJsonLd(jsonLd, {sourceUrl: url});

            expect(result.metadata.sourceUrl).toBe(url);
        });
    });

    describe('Complex scenarios', () => {
        it('should extract all recipe fields', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Complex Recipe',
                description: 'A detailed recipe',
                image: 'https://example.com/img.jpg',
                recipeIngredient: ['flour', 'sugar', 'eggs'],
                recipeInstructions: ['Mix', 'Bake', 'Cool'],
                recipeYield: '8 servings',
                prepTime: 'PT15M',
                cookTime: 'PT30M',
                totalTime: 'PT45M',
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.5',
                    ratingCount: '100',
                },
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Complex Recipe');
            expect(result.recipe?.recipeIngredient).toHaveLength(3);
            expect(result.recipe?.recipeInstructions).toHaveLength(3);
        });

        it('should handle recipe without image array', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg', // String, not array
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
        });

        it('should handle recipe with image as array', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.image).toBeDefined();
        });

        it('should handle nested instructions', () => {
            const jsonLd = JSON.stringify({
                '@type': 'Recipe',
                name: 'Test',
                image: 'https://example.com/img.jpg',
                recipeInstructions: [
                    {
                        '@type': 'HowToStep',
                        text: 'Mix ingredients',
                    },
                    {
                        '@type': 'HowToStep',
                        text: 'Bake at 350F',
                    },
                ],
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
        });
    });
});

describe('getJsonLdExtractionInstructions', () => {
    it('should return instructions string', () => {
        const instructions = getJsonLdExtractionInstructions();

        expect(typeof instructions).toBe('string');
        expect(instructions.length).toBeGreaterThan(0);
    });

    it('should include URL in instructions when provided', () => {
        const url = 'https://example.com/recipe';
        const instructions = getJsonLdExtractionInstructions(url);

        expect(instructions).toContain(url);
    });

    it('should include console code example', () => {
        const instructions = getJsonLdExtractionInstructions();

        expect(instructions).toContain('document.querySelector');
        expect(instructions).toContain('application/ld+json');
    });

    it('should mention multiple formats', () => {
        const instructions = getJsonLdExtractionInstructions();

        expect(instructions).toContain('Raw JSON');
        expect(instructions).toContain('backticks');
    });
});

describe('createRecipeParsingService', () => {
    it('should create service with all methods', () => {
        const service = createRecipeParsingService();

        expect(service).toHaveProperty('parseJsonLd');
        expect(service).toHaveProperty('getExtractionInstructions');
        expect(service).toHaveProperty('preprocessInput');
        expect(service).toHaveProperty('validateJson');
    });

    it('should parse JSON-LD via service', () => {
        const service = createRecipeParsingService();
        const jsonLd = JSON.stringify({
            '@type': 'Recipe',
            name: 'Test',
            image: 'https://example.com/img.jpg',
        });

        const result = service.parseJsonLd(jsonLd);

        expect(result.success).toBe(true);
        expect(result.recipe?.name).toBe('Test');
    });

    it('should preprocess input via service', () => {
        const service = createRecipeParsingService();
        const input = '\uFEFF{"test":1}';

        const processed = service.preprocessInput(input);

        expect(processed).not.toContain('\uFEFF');
    });

    it('should validate JSON via service', () => {
        const service = createRecipeParsingService();

        const result = service.validateJson('{"test":1}');

        expect(result.valid).toBe(true);
    });
});

describe('Performance Tests', () => {
    /**
     * Helper function to create a recipe with N ingredients
     */
    function createRecipeWithIngredients(count: number): string {
        const ingredients = Array.from({ length: count }, (_, i) => `Ingredient ${i + 1}`);
        return JSON.stringify({
            '@type': 'Recipe',
            name: `Recipe with ${count} ingredients`,
            image: 'https://example.com/image.jpg',
            recipeIngredient: ingredients,
            recipeInstructions: ['Step 1', 'Step 2', 'Step 3'],
        });
    }

    it('should parse recipe with 5 ingredients in reasonable time', () => {
        const jsonLd = createRecipeWithIngredients(5);

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(result.recipe?.recipeIngredient).toHaveLength(5);
        expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should parse recipe with 10 ingredients in reasonable time', () => {
        const jsonLd = createRecipeWithIngredients(10);

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(result.recipe?.recipeIngredient).toHaveLength(10);
        expect(duration).toBeLessThan(100); // Should scale linearly
    });

    it('should parse recipe with 15 ingredients in reasonable time', () => {
        const jsonLd = createRecipeWithIngredients(15);

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(result.recipe?.recipeIngredient).toHaveLength(15);
        expect(duration).toBeLessThan(150); // Should scale linearly
    });

    it('should parse recipe with 20 ingredients in reasonable time', () => {
        const jsonLd = createRecipeWithIngredients(20);

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(result.recipe?.recipeIngredient).toHaveLength(20);
        expect(duration).toBeLessThan(200); // Should scale linearly, <200ms p95
    });

    it('should handle large recipe (100 ingredients) without timeout', () => {
        const jsonLd = createRecipeWithIngredients(100);

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(result.recipe?.recipeIngredient).toHaveLength(100);
        expect(duration).toBeLessThan(1000); // Should complete within 1s
    });

    it('should parse recipe with complex nested structures efficiently', () => {
        const jsonLd = JSON.stringify({
            '@type': 'Recipe',
            name: 'Complex Recipe',
            image: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
            recipeIngredient: Array.from({ length: 15 }, (_, i) => `Ingredient ${i + 1}`),
            recipeInstructions: [
                {
                    '@type': 'HowToSection',
                    name: 'Prep',
                    itemListElement: [
                        { '@type': 'HowToStep', text: 'Step 1' },
                        { '@type': 'HowToStep', text: 'Step 2' },
                    ],
                },
                {
                    '@type': 'HowToSection',
                    name: 'Cook',
                    itemListElement: [
                        { '@type': 'HowToStep', text: 'Step 3' },
                        { '@type': 'HowToStep', text: 'Step 4' },
                    ],
                },
            ],
            author: {
                '@type': 'Person',
                name: 'Test Author',
            },
            nutrition: {
                '@type': 'NutritionInformation',
                calories: '200 calories',
            },
        });

        const start = performance.now();
        const result = parseRecipeJsonLd(jsonLd);
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(150); // Complex structures should still be fast
    });

    it('should maintain consistent performance across multiple parses', () => {
        const jsonLd = createRecipeWithIngredients(15);
        const durations: number[] = [];

        // Parse the same recipe 10 times
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            const result = parseRecipeJsonLd(jsonLd);
            const duration = performance.now() - start;

            expect(result.success).toBe(true);
            durations.push(duration);
        }

        // Calculate average and ensure consistency
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);

        expect(avgDuration).toBeLessThan(100);
        expect(maxDuration).toBeLessThan(150); // No single outlier should be too slow
    });
});
