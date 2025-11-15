/**
 * Tests for ingredientParser service
 *
 * These tests verify the ingredient parsing functionality using Firebase AI Logic mocks.
 * Tests follow TDD approach - written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseIngredients, buildBatchPrompt } from '../ingredientParser';

describe('ingredientParser', () => {
  describe('buildBatchPrompt', () => {
    it('should create a properly formatted prompt for single ingredient', () => {
      const ingredients = ["2 cups flour"];
      const prompt = buildBatchPrompt(ingredients);

      expect(prompt).toContain("Parse these recipe ingredients");
      expect(prompt).toContain("1. 2 cups flour");
      expect(prompt).toContain("Extract quantity");
      expect(prompt).toContain("Extract unit");
    });

    it('should create a properly formatted prompt for multiple ingredients', () => {
      const ingredients = ["2 cups flour", "1 tsp salt", "1/2 cup butter"];
      const prompt = buildBatchPrompt(ingredients);

      expect(prompt).toContain("1. 2 cups flour");
      expect(prompt).toContain("2. 1 tsp salt");
      expect(prompt).toContain("3. 1/2 cup butter");
    });

    it('should include metric conversion instructions', () => {
      const ingredients = ["2 cups flour"];
      const prompt = buildBatchPrompt(ingredients);

      expect(prompt).toContain("Convert imperial units to metric");
      expect(prompt).toContain("1 cup = 237 ml");
      expect(prompt).toContain("All-purpose flour: 1 cup = 120 g");
      expect(prompt).toContain("Butter: 1 cup = 227 g");
    });
  });

  describe('parseIngredients', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();
    });

    describe('simple ingredients (US1)', () => {
      it('should parse ingredient with quantity, unit, and name', async () => {
        // Mock response
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "cups",
                ingredientName: "all-purpose flour",
                preparationNotes: null,
                metricQuantity: "240",
                metricUnit: "g",
                confidence: 0.95,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups all-purpose flour"]);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          originalText: "2 cups all-purpose flour",
          quantity: "2",
          unit: "cup",
          ingredientName: "all-purpose flour",
          preparationNotes: null,
          metricQuantity: "240",
          metricUnit: "g",
          confidence: 0.95,
          requiresManualReview: false,
        });
      });

      it('should parse multiple simple ingredients correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([
                {
                  quantity: "2",
                  unit: "cups",
                  ingredientName: "flour",
                  confidence: 0.95,
                },
                {
                  quantity: "1",
                  unit: "tsp",
                  ingredientName: "salt",
                  confidence: 0.98,
                }
              ]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups flour", "1 tsp salt"]);

        expect(result).toHaveLength(2);
        expect(result[0].ingredientName).toBe("flour");
        expect(result[1].ingredientName).toBe("salt");
      });
    });

    describe('fractional ingredients (US1)', () => {
      it('should parse fractional quantities correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1/2",
                unit: "tsp",
                ingredientName: "salt",
                confidence: 0.92,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1/2 tsp salt"]);

        expect(result[0].quantity).toBe("1/2");
        expect(result[0].unit).toBe("tsp");
      });

      it('should parse mixed fractions correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1 1/2",
                unit: "cups",
                ingredientName: "sugar",
                confidence: 0.90,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 1/2 cups sugar"]);

        expect(result[0].quantity).toBe("1 1/2");
      });
    });

    describe('no-quantity ingredients (US1)', () => {
      it('should handle ingredients without quantity', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: null,
                unit: null,
                ingredientName: "salt to taste",
                confidence: 0.85,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["Salt to taste"]);

        expect(result[0].quantity).toBeNull();
        expect(result[0].unit).toBeNull();
        expect(result[0].ingredientName).toBe("salt to taste");
      });

      it('should handle "pinch" as a unit', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "pinch",
                ingredientName: "salt",
                confidence: 0.88,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["A pinch of salt"]);

        expect(result[0].unit).toBe("pinch");
      });
    });

    describe('invalid input (US1)', () => {
      it('should throw error for empty array', async () => {
        await expect(parseIngredients([])).rejects.toThrow('Ingredients array cannot be empty');
      });

      it('should throw error for non-array input', async () => {
        // @ts-expect-error Testing invalid input
        await expect(parseIngredients("not an array")).rejects.toThrow('Ingredients must be an array');
      });

      it('should throw error for array with more than 20 ingredients', async () => {
        const tooMany = new Array(21).fill("1 cup flour");
        await expect(parseIngredients(tooMany)).rejects.toThrow('Maximum 20 ingredients per request');
      });

      it('should throw error for ingredient exceeding 500 characters', async () => {
        const tooLong = "A".repeat(501);
        await expect(parseIngredients([tooLong])).rejects.toThrow('exceeds 500 characters');
      });

      it('should throw error for non-string ingredient', async () => {
        // @ts-expect-error Testing invalid input
        await expect(parseIngredients([123])).rejects.toThrow('must be a string');
      });
    });

    describe('requiresManualReview flag (US1)', () => {
      it('should set requiresManualReview to false for high confidence (>= 0.7)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "cups",
                ingredientName: "flour",
                confidence: 0.95,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups flour"]);
        expect(result[0].requiresManualReview).toBe(false);
      });

      it('should set requiresManualReview to true for low confidence (< 0.7)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "cups",
                ingredientName: "flour",
                confidence: 0.65,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups flour"]);
        expect(result[0].requiresManualReview).toBe(true);
      });
    });

    describe('volume conversions (US2)', () => {
      it('should convert cups to ml correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "cup",
                ingredientName: "water",
                metricQuantity: "237",
                metricUnit: "ml",
                confidence: 0.98,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 cup water"]);

        expect(result[0].metricQuantity).toBe("237");
        expect(result[0].metricUnit).toBe("ml");
      });

      it('should convert tablespoons to ml correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "tbsp",
                ingredientName: "olive oil",
                metricQuantity: "30",
                metricUnit: "ml",
                confidence: 0.97,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 tbsp olive oil"]);

        expect(result[0].metricQuantity).toBe("30");
        expect(result[0].metricUnit).toBe("ml");
      });

      it('should convert teaspoons to ml correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "tsp",
                ingredientName: "vanilla extract",
                metricQuantity: "5",
                metricUnit: "ml",
                confidence: 0.98,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 tsp vanilla extract"]);

        expect(result[0].metricQuantity).toBe("5");
        expect(result[0].metricUnit).toBe("ml");
      });
    });

    describe('weight conversions (US2)', () => {
      it('should convert pounds to grams correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "lb",
                ingredientName: "beef",
                metricQuantity: "454",
                metricUnit: "g",
                confidence: 0.98,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 lb beef"]);

        expect(result[0].metricQuantity).toBe("454");
        expect(result[0].metricUnit).toBe("g");
      });

      it('should convert ounces to grams correctly', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "8",
                unit: "oz",
                ingredientName: "chocolate",
                metricQuantity: "227",
                metricUnit: "g",
                confidence: 0.97,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["8 oz chocolate"]);

        expect(result[0].metricQuantity).toBe("227");
        expect(result[0].metricUnit).toBe("g");
      });
    });

    describe('density-based conversions (US2)', () => {
      it('should convert cups of flour to grams using density', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "cups",
                ingredientName: "all-purpose flour",
                metricQuantity: "240",
                metricUnit: "g",
                confidence: 0.95,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups all-purpose flour"]);

        expect(result[0].metricQuantity).toBe("240");
        expect(result[0].metricUnit).toBe("g");
      });

      it('should convert cups of butter to grams using density', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "cup",
                ingredientName: "butter",
                metricQuantity: "227",
                metricUnit: "g",
                confidence: 0.96,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 cup butter"]);

        expect(result[0].metricQuantity).toBe("227");
        expect(result[0].metricUnit).toBe("g");
      });

      it('should convert cups of sugar to grams using density', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "cup",
                ingredientName: "sugar",
                metricQuantity: "200",
                metricUnit: "g",
                confidence: 0.95,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 cup sugar"]);

        expect(result[0].metricQuantity).toBe("200");
        expect(result[0].metricUnit).toBe("g");
      });

      it('should convert cups of milk to ml (liquid)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "cup",
                ingredientName: "milk",
                metricQuantity: "237",
                metricUnit: "ml",
                confidence: 0.98,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 cup milk"]);

        expect(result[0].metricQuantity).toBe("237");
        expect(result[0].metricUnit).toBe("ml");
      });
    });

    describe('already-metric ingredients (US2)', () => {
      it('should not convert ingredients already in metric units', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "500",
                unit: "g",
                ingredientName: "flour",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.98,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["500g flour"]);

        expect(result[0].quantity).toBe("500");
        expect(result[0].unit).toBe("g");
        expect(result[0].metricQuantity).toBeNull();
        expect(result[0].metricUnit).toBeNull();
      });

      it('should not convert milliliters', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "250",
                unit: "ml",
                ingredientName: "water",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.99,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["250 ml water"]);

        expect(result[0].metricQuantity).toBeNull();
        expect(result[0].metricUnit).toBeNull();
      });
    });

    describe('error handling', () => {
      it('should handle network errors gracefully', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('network error')),
        });

        await expect(parseIngredients(["2 cups flour"])).rejects.toThrow('Failed to connect to Firebase AI Logic');
      });

      it('should handle rate limit errors', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('rate limit exceeded')),
        });

        await expect(parseIngredients(["2 cups flour"])).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle generic parsing failures', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('unknown error')),
        });

        await expect(parseIngredients(["2 cups flour"])).rejects.toThrow('Failed to parse ingredients');
      });
    });

    // User Story 3: Complex ingredients and edge cases
    describe('US3: Complex ingredients', () => {
      it('should handle ingredient ranges (2-3 cups)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2-3",
                unit: "cups",
                ingredientName: "all-purpose flour",
                preparationNotes: null,
                metricQuantity: "240-360",
                metricUnit: "g",
                confidence: 0.9,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2-3 cups all-purpose flour"]);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe("2-3");
        expect(result[0].unit).toBe("cup");
        expect(result[0].ingredientName).toBe("all-purpose flour");
        expect(result[0].metricQuantity).toBe("240-360");
        expect(result[0].metricUnit).toBe("g");
      });

      it('should preserve preparation notes (chopped, softened)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "cup",
                ingredientName: "butter",
                preparationNotes: "softened",
                metricQuantity: "227",
                metricUnit: "g",
                confidence: 0.95,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 cup butter, softened"]);

        expect(result).toHaveLength(1);
        expect(result[0].ingredientName).toBe("butter");
        expect(result[0].preparationNotes).toBe("softened");
        expect(result[0].confidence).toBeGreaterThanOrEqual(0.7);
      });

      it('should handle multiple preparation notes', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "cups",
                ingredientName: "onions",
                preparationNotes: "finely chopped",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.88,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 cups onions, finely chopped"]);

        expect(result).toHaveLength(1);
        expect(result[0].preparationNotes).toBe("finely chopped");
      });

      it('should handle unusual units (pinch, dash, knob)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "pinch",
                ingredientName: "salt",
                preparationNotes: null,
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.85,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 pinch salt"]);

        expect(result).toHaveLength(1);
        expect(result[0].unit).toBe("pinch");
        expect(result[0].ingredientName).toBe("salt");
        expect(result[0].metricQuantity).toBeNull();
      });

      it('should handle "dash" as a unit', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "2",
                unit: "dashes",
                ingredientName: "bitters",
                preparationNotes: null,
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.82,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["2 dashes bitters"]);

        expect(result).toHaveLength(1);
        expect(result[0].unit).toBe("dash");
      });

      it('should handle "knob" as a unit', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "1",
                unit: "knob",
                ingredientName: "ginger",
                preparationNotes: "peeled and minced",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.75,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["1 knob ginger, peeled and minced"]);

        expect(result).toHaveLength(1);
        expect(result[0].unit).toBe("whole");
        expect(result[0].preparationNotes).toBe("peeled and minced");
      });

      it('should split multiple ingredients in one string (not expected to parse perfectly)', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: null,
                unit: null,
                ingredientName: "salt and pepper",
                preparationNotes: "to taste",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.65,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["Salt and pepper to taste"]);

        expect(result).toHaveLength(1);
        expect(result[0].ingredientName).toContain("salt");
        expect(result[0].confidence).toBeLessThan(0.7);
        expect(result[0].requiresManualReview).toBe(true);
      });

      it('should flag low-confidence parses for manual review', async () => {
        const { getGenerativeModel } = (global as any).__firebaseMocks;
        getGenerativeModel.mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                quantity: "some",
                unit: null,
                ingredientName: "fresh herbs",
                preparationNotes: "of your choice",
                metricQuantity: null,
                metricUnit: null,
                confidence: 0.55,
              }]),
            },
          }),
        });

        const result = await parseIngredients(["Some fresh herbs of your choice"]);

        expect(result).toHaveLength(1);
        expect(result[0].confidence).toBeLessThan(0.7);
        expect(result[0].requiresManualReview).toBe(true);
      });
    });
  });
});
