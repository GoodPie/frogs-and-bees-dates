import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createExclusion,
    applyExclusions,
    getExcludableReferences,
    isReferenceExcluded,
    findExclusionForReference,
} from '../exclusionManager';
import type {
    StructuredInstruction,
    ScalingExclusion,
    IngredientRefSegment,
    TextSegment,
} from '../../types/Recipe';

describe('exclusionManager', () => {
    let mockInstructions: StructuredInstruction[];
    let mockExclusions: ScalingExclusion[];

    beforeEach(() => {
        // Create mock instructions with segments
        mockInstructions = [
            {
                id: 'inst-1',
                stepNumber: 1,
                originalText: 'Mix 2 eggs and 1 cup flour',
                segments: [
                    { type: 'text', content: 'Mix ' } as TextSegment,
                    {
                        type: 'ingredient_ref',
                        originalText: '2 eggs',
                        ingredientName: 'egg',
                        originalQuantity: '2',
                        unit: null,
                        preposition: null,
                        ingredientIndex: 0,
                        scalingDisabled: false,
                    } as IngredientRefSegment,
                    { type: 'text', content: ' and ' } as TextSegment,
                    {
                        type: 'ingredient_ref',
                        originalText: '1 cup flour',
                        ingredientName: 'flour',
                        originalQuantity: '1',
                        unit: 'cup',
                        preposition: null,
                        ingredientIndex: 1,
                        scalingDisabled: false,
                    } as IngredientRefSegment,
                ],
            },
            {
                id: 'inst-2',
                stepNumber: 2,
                originalText: 'Add 2 tbsp butter',
                segments: [
                    { type: 'text', content: 'Add ' } as TextSegment,
                    {
                        type: 'ingredient_ref',
                        originalText: '2 tbsp butter',
                        ingredientName: 'butter',
                        originalQuantity: '2',
                        unit: 'tbsp',
                        preposition: null,
                        ingredientIndex: 2,
                        scalingDisabled: false,
                    } as IngredientRefSegment,
                ],
            },
        ];

        mockExclusions = [];
    });

    describe('createExclusion', () => {
        it('should create a new exclusion with all required fields', () => {
            const exclusion = createExclusion(1, '2 eggs', 'egg');

            expect(exclusion).toMatchObject({
                stepNumber: 1,
                excludedText: '2 eggs',
                ingredientName: 'egg',
            });
            expect(exclusion.id).toBeDefined();
            expect(exclusion.createdAt).toBeGreaterThan(0);
        });

        it('should generate unique IDs for different exclusions', () => {
            const excl1 = createExclusion(1, '2 eggs', 'egg');
            const excl2 = createExclusion(1, '1 cup flour', 'flour');

            expect(excl1.id).not.toBe(excl2.id);
        });
    });

    describe('applyExclusions', () => {
        it('should return instructions unchanged when no exclusions exist', () => {
            const result = applyExclusions(mockInstructions, []);

            expect(result).toEqual(mockInstructions);
        });

        it('should mark matching segment as scalingDisabled=true', () => {
            const exclusions: ScalingExclusion[] = [
                createExclusion(1, '2 eggs', 'egg'),
            ];

            const result = applyExclusions(mockInstructions, exclusions);

            // First instruction should have egg reference disabled
            const eggSegment = result[0].segments.find(
                s => s.type === 'ingredient_ref' && (s as IngredientRefSegment).ingredientName === 'egg'
            ) as IngredientRefSegment;

            expect(eggSegment.scalingDisabled).toBe(true);

            // Flour reference should still be enabled
            const flourSegment = result[0].segments.find(
                s => s.type === 'ingredient_ref' && (s as IngredientRefSegment).ingredientName === 'flour'
            ) as IngredientRefSegment;

            expect(flourSegment.scalingDisabled).toBe(false);
        });

        it('should apply multiple exclusions to same instruction', () => {
            const exclusions: ScalingExclusion[] = [
                createExclusion(1, '2 eggs', 'egg'),
                createExclusion(1, '1 cup flour', 'flour'),
            ];

            const result = applyExclusions(mockInstructions, exclusions);

            // Both references should be disabled
            const ingredientRefs = result[0].segments.filter(
                s => s.type === 'ingredient_ref'
            ) as IngredientRefSegment[];

            expect(ingredientRefs[0].scalingDisabled).toBe(true);
            expect(ingredientRefs[1].scalingDisabled).toBe(true);
        });

        it('should only apply exclusions to matching step number', () => {
            const exclusions: ScalingExclusion[] = [
                createExclusion(1, '2 eggs', 'egg'),
            ];

            const result = applyExclusions(mockInstructions, exclusions);

            // Step 1 egg should be disabled
            const step1EggSeg = result[0].segments.find(
                s => s.type === 'ingredient_ref'
            ) as IngredientRefSegment;
            expect(step1EggSeg.scalingDisabled).toBe(true);

            // Step 2 butter should not be affected
            const step2ButterSeg = result[1].segments.find(
                s => s.type === 'ingredient_ref'
            ) as IngredientRefSegment;
            expect(step2ButterSeg.scalingDisabled).toBe(false);
        });

        it('should not modify text segments', () => {
            const exclusions: ScalingExclusion[] = [
                createExclusion(1, '2 eggs', 'egg'),
            ];

            const result = applyExclusions(mockInstructions, exclusions);

            // All text segments should remain unchanged
            const textSegments = result[0].segments.filter(s => s.type === 'text');
            expect(textSegments).toHaveLength(2);
            expect(textSegments[0]).toEqual({ type: 'text', content: 'Mix ' });
            expect(textSegments[1]).toEqual({ type: 'text', content: ' and ' });
        });
    });

    describe('getExcludableReferences', () => {
        it('should return all ingredient reference segments', () => {
            const refs = getExcludableReferences(mockInstructions[0]);

            expect(refs).toHaveLength(2);
            expect(refs[0].ingredientName).toBe('egg');
            expect(refs[1].ingredientName).toBe('flour');
        });

        it('should return empty array for instruction with no ingredient refs', () => {
            const textOnlyInstruction: StructuredInstruction = {
                id: 'inst-3',
                stepNumber: 3,
                originalText: 'Preheat oven to 350°F',
                segments: [
                    { type: 'text', content: 'Preheat oven to 350°F' } as TextSegment,
                ],
            };

            const refs = getExcludableReferences(textOnlyInstruction);

            expect(refs).toHaveLength(0);
        });
    });

    describe('isReferenceExcluded', () => {
        beforeEach(() => {
            mockExclusions = [
                createExclusion(1, '2 eggs', 'egg'),
                createExclusion(2, '2 tbsp butter', 'butter'),
            ];
        });

        it('should return true for excluded reference', () => {
            const result = isReferenceExcluded(
                1,
                '2 eggs',
                'egg',
                mockExclusions
            );

            expect(result).toBe(true);
        });

        it('should return false for non-excluded reference', () => {
            const result = isReferenceExcluded(
                1,
                '1 cup flour',
                'flour',
                mockExclusions
            );

            expect(result).toBe(false);
        });

        it('should return false for wrong step number', () => {
            const result = isReferenceExcluded(
                3,
                '2 eggs',
                'egg',
                mockExclusions
            );

            expect(result).toBe(false);
        });
    });

    describe('findExclusionForReference', () => {
        beforeEach(() => {
            mockExclusions = [
                createExclusion(1, '2 eggs', 'egg'),
                createExclusion(2, '2 tbsp butter', 'butter'),
            ];
        });

        it('should find matching exclusion', () => {
            const result = findExclusionForReference(
                1,
                '2 eggs',
                'egg',
                mockExclusions
            );

            expect(result).toBeDefined();
            expect(result?.stepNumber).toBe(1);
            expect(result?.excludedText).toBe('2 eggs');
        });

        it('should return undefined when no match found', () => {
            const result = findExclusionForReference(
                1,
                '1 cup flour',
                'flour',
                mockExclusions
            );

            expect(result).toBeUndefined();
        });
    });
});
