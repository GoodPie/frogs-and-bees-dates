import {describe, it, expect} from 'vitest';
import {parseRecipeJsonLd, getJsonLdExtractionInstructions} from '../recipeParser.ts';

describe('recipeParser', () => {
    describe('parseRecipeJsonLd', () => {
        it('should parse valid JSON-LD recipe', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Chocolate Chip Cookies',
                image: 'https://example.com/cookies.jpg',
                description: 'Delicious homemade chocolate chip cookies',
                author: {
                    name: 'John Doe'
                },
                prepTime: 'PT15M',
                cookTime: 'PT12M',
                totalTime: 'PT27M',
                recipeYield: '24 cookies',
                recipeIngredient: [
                    '2 cups flour',
                    '1 cup sugar',
                    '1 cup chocolate chips'
                ],
                recipeInstructions: [
                    'Mix dry ingredients',
                    'Add wet ingredients',
                    'Bake at 350°F for 12 minutes'
                ],
                recipeCategory: ['Dessert', 'Cookies'],
                recipeCuisine: ['American'],
                keywords: ['cookies', 'chocolate', 'dessert'],
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.recipe).toBeDefined();
            expect(result.recipe?.name).toBe('Chocolate Chip Cookies');
            expect(result.recipe?.image).toBe('https://example.com/cookies.jpg');
            expect(result.recipe?.description).toBe('Delicious homemade chocolate chip cookies');
            expect(result.recipe?.author).toBe('John Doe');
            expect(result.recipe?.prepTime).toBe('PT15M');
            expect(result.recipe?.cookTime).toBe('PT12M');
            expect(result.recipe?.recipeYield).toBe('24 cookies');
            expect(result.recipe?.recipeIngredient).toHaveLength(3);
            expect(result.recipe?.recipeInstructions).toHaveLength(3);
            expect(result.recipe?.recipeCategory).toEqual(['Dessert', 'Cookies']);
            expect(result.recipe?.recipeCuisine).toEqual(['American']);
            expect(result.recipe?.keywords).toEqual(['cookies', 'chocolate', 'dessert']);
        });

        it('should handle string author format', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                author: 'Jane Smith',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.author).toBe('Jane Smith');
        });

        it('should handle image array', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: [
                    'https://example.com/image1.jpg',
                    'https://example.com/image2.jpg'
                ],
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.image).toBe('https://example.com/image1.jpg');
        });

        it('should handle image object array', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: [
                    {url: 'https://example.com/image1.jpg'},
                    {url: 'https://example.com/image2.jpg'}
                ],
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.image).toBe('https://example.com/image1.jpg');
        });

        it('should handle HowToStep format for instructions', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: [
                    {text: 'First step'},
                    {name: 'Mixing', text: 'Mix ingredients together'},
                    {text: 'Third step'}
                ]
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.recipeInstructions).toEqual([
                'First step',
                'Mixing: Mix ingredients together',
                'Third step'
            ]);
        });

        it('should handle @graph wrapper', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'WebSite',
                        name: 'Recipe Site'
                    },
                    {
                        '@type': 'Recipe',
                        name: 'Test Recipe',
                        image: 'https://example.com/test.jpg',
                        recipeIngredient: ['ingredient 1'],
                        recipeInstructions: ['step 1']
                    }
                ]
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should handle array of objects', () => {
            const jsonLd = JSON.stringify([
                {
                    '@type': 'WebSite',
                    name: 'Recipe Site'
                },
                {
                    '@type': 'Recipe',
                    name: 'Test Recipe',
                    image: 'https://example.com/test.jpg',
                    recipeIngredient: ['ingredient 1'],
                    recipeInstructions: ['step 1']
                }
            ]);

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should return error for invalid JSON', () => {
            const result = parseRecipeJsonLd('not valid json');

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Invalid JSON format. Please check your input.');
        });

        it('should return error when Recipe type not found', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                name: 'Some Article'
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('No Recipe schema found in JSON-LD. Please ensure the data contains a Recipe type.');
        });

        it('should return error when name is missing', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Recipe name is required');
        });

        it('should return error when image is missing', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Recipe image is required');
        });

        it('should return warning when ingredients are missing', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.warnings).toContain('No ingredients found');
        });

        it('should return warning when instructions are missing', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.warnings).toContain('No instructions found');
        });

        it('should handle string keywords', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                keywords: 'easy, quick, healthy',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.keywords).toEqual(['easy, quick, healthy']);
        });

        it('should handle array @type with Recipe', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': ['Recipe', 'Article'],
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            const result = parseRecipeJsonLd(jsonLd);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should handle escaped JSON with \\n and \\" characters', () => {
            // Simulate what happens when user copies stringified JSON from console
            const validJson = {
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            };

            // Create escaped version with literal \n and \" characters
            const escapedJson = JSON.stringify(JSON.stringify(validJson));
            // Remove the surrounding quotes to simulate the actual paste
            const withoutQuotes = escapedJson.slice(1, -1);

            const result = parseRecipeJsonLd(withoutQuotes);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should handle backtick-wrapped JSON', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            // Wrap in backticks (template literal markers)
            const backtickWrapped = `\`${jsonLd}\``;

            const result = parseRecipeJsonLd(backtickWrapped);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should handle extra whitespace', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            // Add extra whitespace before and after
            const withWhitespace = `\n\n   ${jsonLd}   \n\n`;

            const result = parseRecipeJsonLd(withWhitespace);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should handle BOM character', () => {
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Recipe',
                name: 'Test Recipe',
                image: 'https://example.com/test.jpg',
                recipeIngredient: ['ingredient 1'],
                recipeInstructions: ['step 1']
            });

            // Add BOM character at the start
            const withBOM = '\uFEFF' + jsonLd;

            const result = parseRecipeJsonLd(withBOM);

            expect(result.success).toBe(true);
            expect(result.recipe?.name).toBe('Test Recipe');
        });

        it('should provide helpful error for escaped JSON that fails preprocessing', () => {
            // Create intentionally malformed escaped JSON
            const malformed = '{"name": "Test\\nRecipe", "missing": closing bracket';

            const result = parseRecipeJsonLd(malformed);

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors[0]).toContain('Invalid JSON format');
        });
    });

    describe('getJsonLdExtractionInstructions', () => {
        it('should return instructions without URL', () => {
            const instructions = getJsonLdExtractionInstructions();

            expect(instructions).toContain('Open the recipe webpage in your browser');
            expect(instructions).toContain('DevTools');
            expect(instructions).toContain('script[type="application/ld+json"]');
        });

        it('should return instructions with URL', () => {
            const url = 'https://example.com/recipe';
            const instructions = getJsonLdExtractionInstructions(url);

            expect(instructions).toContain(url);
            expect(instructions).toContain('Open https://example.com/recipe in your browser');
        });
    });
});
