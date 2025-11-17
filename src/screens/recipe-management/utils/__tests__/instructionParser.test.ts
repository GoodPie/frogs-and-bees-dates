import { describe, it, expect } from 'vitest';
import {
    parseInstruction,
    parseAllInstructions,
    reconstructInstructionText,
} from '../instructionParser';
import type { ParsedIngredient } from '@/models/ParsedIngredient';

describe('instructionParser', () => {
    const mockIngredients: ParsedIngredient[] = [
        {
            ingredientName: 'egg', quantity: 2, unit: null, originalText: "",
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0,
            requiresManualReview: false,
            parsingMethod: "user"
        },
        {
            ingredientName: 'flour', quantity: 1, unit: 'cup',
            originalText: "",
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0,
            requiresManualReview: false,
            parsingMethod: "user"
        },
        {
            ingredientName: 'butter', quantity: 2, unit: 'tbsp',
            originalText: "",
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0,
            requiresManualReview: false,
            parsingMethod: "user"
        },
        {
            ingredientName: 'salt', quantity: '1/2', unit: 'tsp',
            originalText: "",
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0,
            requiresManualReview: false,
            parsingMethod: "user"
        },
    ];

    describe('parseInstruction', () => {
        it('should parse instruction with single ingredient reference', () => {
            const result = parseInstruction('Mix 2 eggs together', 1, mockIngredients);

            expect(result.stepNumber).toBe(1);
            expect(result.originalText).toBe('Mix 2 eggs together');
            expect(result.segments).toHaveLength(3);

            // First segment: text before ingredient
            expect(result.segments[0]).toEqual({
                type: 'text',
                content: 'Mix ',
            });

            // Second segment: ingredient reference
            expect(result.segments[1]).toMatchObject({
                type: 'ingredient_ref',
                ingredientName: 'egg',
                originalQuantity: '2',
                unit: null,
                ingredientIndex: 0,
                scalingDisabled: false,
            });

            // Third segment: text after ingredient
            expect(result.segments[2]).toEqual({
                type: 'text',
                content: ' together',
            });
        });

        it('should parse instruction with multiple ingredient references', () => {
            const result = parseInstruction(
                'Mix 2 eggs and 1 cup flour',
                1,
                mockIngredients
            );

            expect(result.segments).toHaveLength(4);
            expect(result.segments[0]).toEqual({ type: 'text', content: 'Mix ' });
            expect(result.segments[1]).toMatchObject({
                type: 'ingredient_ref',
                ingredientName: 'egg',
            });
            expect(result.segments[2]).toEqual({ type: 'text', content: ' and ' });
            expect(result.segments[3]).toMatchObject({
                type: 'ingredient_ref',
                ingredientName: 'flour',
            });
        });

        it('should handle instruction with no ingredient references', () => {
            const result = parseInstruction('Preheat oven to 350°F', 1, mockIngredients);

            expect(result.segments).toHaveLength(1);
            expect(result.segments[0]).toEqual({
                type: 'text',
                content: 'Preheat oven to 350°F',
            });
        });

        it('should handle "of" preposition correctly', () => {
            const result = parseInstruction('Add 1 cup of flour', 1, mockIngredients);

            const ingredientSeg = result.segments.find(
                s => s.type === 'ingredient_ref'
            ) as any;
            expect(ingredientSeg).toBeDefined();
            expect(ingredientSeg.preposition).toBe('of');
            expect(ingredientSeg.unit).toBe('cup');
        });

        it('should handle "with" preposition correctly', () => {
            const result = parseInstruction('Mix 2 tbsp with butter', 1, mockIngredients);

            const ingredientSeg = result.segments.find(
                s => s.type === 'ingredient_ref'
            ) as any;
            expect(ingredientSeg).toBeDefined();
            expect(ingredientSeg.preposition).toBe('with');
            expect(ingredientSeg.unit).toBe('tbsp');
        });

        it('should auto-exclude "to taste" patterns', () => {
            const result = parseInstruction(
                'Add 1/2 tsp salt to taste',
                1,
                mockIngredients
            );

            // Should not find any ingredient references because of "to taste"
            const ingredientRefs = result.segments.filter(s => s.type === 'ingredient_ref');
            expect(ingredientRefs).toHaveLength(0);
        });

        it('should auto-exclude "as needed" patterns', () => {
            const result = parseInstruction(
                'Add 2 eggs as needed',
                1,
                mockIngredients
            );

            const ingredientRefs = result.segments.filter(s => s.type === 'ingredient_ref');
            expect(ingredientRefs).toHaveLength(0);
        });

        it('should handle plural ingredient names', () => {
            const result = parseInstruction('Beat 2 eggs', 1, mockIngredients);

            const ingredientSeg = result.segments.find(
                s => s.type === 'ingredient_ref'
            ) as any;
            expect(ingredientSeg).toBeDefined();
            expect(ingredientSeg.ingredientName).toBe('egg');
            expect(ingredientSeg.originalText).toBe('2 eggs');
        });

        it('should generate unique instruction ID', () => {
            const result1 = parseInstruction('Mix ingredients', 1, mockIngredients);
            const result2 = parseInstruction('Mix ingredients', 1, mockIngredients);

            expect(result1.id).toBeDefined();
            expect(result2.id).toBeDefined();
            expect(result1.id).not.toBe(result2.id);
        });
    });

    describe('parseAllInstructions', () => {
        it('should parse multiple instructions', () => {
            const instructions = [
                'Mix 2 eggs',
                'Add 1 cup flour',
                'Bake at 350°F',
            ];

            const result = parseAllInstructions(instructions, mockIngredients);

            expect(result).toHaveLength(3);
            expect(result[0].stepNumber).toBe(1);
            expect(result[1].stepNumber).toBe(2);
            expect(result[2].stepNumber).toBe(3);
        });

        it('should handle empty instructions array', () => {
            const result = parseAllInstructions([], mockIngredients);
            expect(result).toHaveLength(0);
        });
    });

    describe('reconstructInstructionText', () => {
        it('should reconstruct original text from segments', () => {
            const instruction = 'Mix 2 eggs and 1 cup flour';
            const parsed = parseInstruction(instruction, 1, mockIngredients);

            const reconstructed = reconstructInstructionText(parsed.segments);
            expect(reconstructed).toBe(instruction);
        });

        it('should reconstruct text with no ingredient references', () => {
            const instruction = 'Preheat oven to 350°F';
            const parsed = parseInstruction(instruction, 1, mockIngredients);

            const reconstructed = reconstructInstructionText(parsed.segments);
            expect(reconstructed).toBe(instruction);
        });

        it('should handle edge case with only ingredient reference', () => {
            const instruction = '2 eggs';
            const parsed = parseInstruction(instruction, 1, mockIngredients);

            const reconstructed = reconstructInstructionText(parsed.segments);
            expect(reconstructed).toBe(instruction);
        });
    });
});
