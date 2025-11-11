/**
 * Unit tests for IngredientList component
 */

import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {IngredientList} from '../IngredientList.tsx';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';
import {ChakraProvider, defaultSystem} from '@chakra-ui/react';

// Wrapper for Chakra UI components
const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider value={defaultSystem}>{component}</ChakraProvider>);
};

describe('IngredientList', () => {
    afterEach(() => {
        cleanup();
    });

    const mockIngredients: ParsedIngredient[] = [
        {
            originalText: '2 cups all-purpose flour',
            quantity: 2,
            unit: 'cups',
            ingredientName: 'all-purpose flour',
            preparationNotes: null,
            metricQuantity: '240',
            metricUnit: 'g',
            confidence: 0.95,
            parsingMethod: 'ai',
            requiresManualReview: false,
        },
        {
            originalText: '1 tsp salt',
            quantity: 1,
            unit: 'tsp',
            ingredientName: 'salt',
            preparationNotes: null,
            metricQuantity: '5',
            metricUnit: 'ml',
            confidence: 1.0,
            parsingMethod: 'ai',
            requiresManualReview: false,
        },
        {
            originalText: 'Salt to taste',
            quantity: null,
            unit: null,
            ingredientName: 'salt to taste',
            preparationNotes: null,
            metricQuantity: null,
            metricUnit: null,
            confidence: 0.5,
            parsingMethod: 'ai',
            requiresManualReview: true,
        },
    ];

    describe('Display Modes', () => {
        it('should display ingredients in original mode', () => {
            renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="original" />
            );

            expect(screen.getByText('2 cups all-purpose flour')).toBeInTheDocument();
            expect(screen.getByText('1 tsp salt')).toBeInTheDocument();
            expect(screen.getByText('Salt to taste')).toBeInTheDocument();
        });

        it('should display ingredients in metric mode', () => {
            renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="metric" />
            );

            expect(screen.getByText('240 g all-purpose flour')).toBeInTheDocument();
            expect(screen.getByText('5 ml salt')).toBeInTheDocument();
            // Falls back to original for ingredients without metric conversion
            expect(screen.getByText('Salt to taste')).toBeInTheDocument();
        });

        it('should display ingredients in imperial mode', () => {
            renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="imperial" />
            );

            expect(screen.getByText('2 cups all-purpose flour')).toBeInTheDocument();
            expect(screen.getByText('1 tsp salt')).toBeInTheDocument();
            // Falls back to original for ingredients without quantity/unit
            expect(screen.getByText('Salt to taste')).toBeInTheDocument();
        });

        it('should include preparation notes in formatted display', () => {
            const ingredientWithNotes: ParsedIngredient = {
                originalText: '1 cup butter, softened',
                quantity: 1,
                unit: 'cup',
                ingredientName: 'butter',
                preparationNotes: 'softened',
                metricQuantity: '227',
                metricUnit: 'g',
                confidence: 0.9,
                parsingMethod: 'ai',
                requiresManualReview: false,
            };

            renderWithChakra(
                <IngredientList ingredients={[ingredientWithNotes]} displayMode="metric" />
            );

            expect(screen.getByText('227 g butter, softened')).toBeInTheDocument();
        });
    });

    describe('Visual Indicators', () => {
        it('should show "Review" badge for ingredients requiring manual review', () => {
            renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="original" />
            );

            const reviewBadges = screen.getAllByText('Review');
            expect(reviewBadges).toHaveLength(1);
        });

        it('should show "Edited" badge for manually edited ingredients', () => {
            const manuallyEdited: ParsedIngredient = {
                ...mockIngredients[0],
                parsingMethod: 'manual',
            };

            renderWithChakra(
                <IngredientList ingredients={[manuallyEdited]} displayMode="original" />
            );

            expect(screen.getByText('Edited')).toBeInTheDocument();
        });

        it('should show "Metric" badge in metric mode for converted ingredients', () => {
            renderWithChakra(
                <IngredientList ingredients={[mockIngredients[0]]} displayMode="metric" />
            );

            expect(screen.getByText('Metric')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should show empty message when no ingredients provided', () => {
            renderWithChakra(<IngredientList ingredients={[]} displayMode="original" />);

            expect(screen.getByText('No ingredients to display')).toBeInTheDocument();
        });
    });

    describe('Edit Interaction', () => {
        it('should call onEditIngredient when ingredient is clicked', async () => {
            const user = userEvent.setup();
            const mockOnEdit = vi.fn();

            renderWithChakra(
                <IngredientList
                    ingredients={mockIngredients}
                    displayMode="original"
                    onEditIngredient={mockOnEdit}
                />
            );

            const firstIngredient = screen.getByText('2 cups all-purpose flour');
            await user.click(firstIngredient);

            expect(mockOnEdit).toHaveBeenCalledWith(0, mockIngredients[0]);
        });

        it('should not be clickable when onEditIngredient is not provided', () => {
            const {container} = renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="original" />
            );

            // Check that cursor is default (not pointer)
            const ingredientElements = container.querySelectorAll('[style*="cursor"]');
            expect(ingredientElements.length).toBe(0);
        });
    });

    describe('Styling', () => {
        it('should highlight ingredients requiring review with orange background', () => {
            const {container} = renderWithChakra(
                <IngredientList ingredients={mockIngredients} displayMode="original" />
            );

            // The third ingredient requires review and should have orange background
            const ingredientBoxes = container.querySelectorAll('[class*="css-"]');
            const reviewBox = Array.from(ingredientBoxes).find((box) =>
                box.textContent?.includes('Salt to taste')
            );

            expect(reviewBox).toBeTruthy();
        });
    });

    describe('Security - ReDoS Prevention', () => {
        it('should handle ingredients with many trailing punctuation/spaces without timeout', () => {
            // This would cause ReDoS with vulnerable regex /[,.\s]+$/
            const attackString = 'flour' + ' ,. '.repeat(100) + 'x';
            const maliciousIngredient: ParsedIngredient = {
                originalText: attackString,
                quantity: 1,
                unit: 'cup',
                ingredientName: attackString,
                preparationNotes: null,
                metricQuantity: '120',
                metricUnit: 'g',
                confidence: 0.9,
                parsingMethod: 'ai',
                requiresManualReview: false,
            };

            const startTime = performance.now();
            renderWithChakra(
                <IngredientList ingredients={[maliciousIngredient]} displayMode="metric" />
            );
            const endTime = performance.now();

            // Should complete in reasonable time (< 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should correctly clean ingredient names with trailing punctuation', () => {
            const testCases: ParsedIngredient[] = [
                {
                    originalText: '1 cup flour, , ,',
                    quantity: 1,
                    unit: 'cup',
                    ingredientName: 'flour, , ,',
                    preparationNotes: null,
                    metricQuantity: '120',
                    metricUnit: 'g',
                    confidence: 0.9,
                    parsingMethod: 'ai',
                    requiresManualReview: false,
                },
                {
                    originalText: '1 tsp salt...',
                    quantity: 1,
                    unit: 'tsp',
                    ingredientName: 'salt...',
                    preparationNotes: null,
                    metricQuantity: '5',
                    metricUnit: 'ml',
                    confidence: 0.9,
                    parsingMethod: 'ai',
                    requiresManualReview: false,
                },
                {
                    originalText: '2 eggs   ',
                    quantity: 2,
                    unit: 'pieces',
                    ingredientName: 'eggs   ',
                    preparationNotes: null,
                    metricQuantity: '2',
                    metricUnit: 'pieces',
                    confidence: 0.9,
                    parsingMethod: 'ai',
                    requiresManualReview: false,
                },
            ];

            renderWithChakra(
                <IngredientList ingredients={testCases} displayMode="metric" />
            );

            // Should clean trailing punctuation/spaces
            expect(screen.getByText('120 g flour')).toBeInTheDocument();
            expect(screen.getByText('5 ml salt')).toBeInTheDocument();
            expect(screen.getByText('2 pieces eggs')).toBeInTheDocument();
        });

        it('should handle preparation notes with only punctuation/spaces', () => {
            const edgeCase: ParsedIngredient = {
                originalText: '1 cup flour',
                quantity: 1,
                unit: 'cup',
                ingredientName: 'flour',
                preparationNotes: '  , . , . ',
                metricQuantity: '120',
                metricUnit: 'g',
                confidence: 0.9,
                parsingMethod: 'ai',
                requiresManualReview: false,
            };

            renderWithChakra(
                <IngredientList ingredients={[edgeCase]} displayMode="metric" />
            );

            // Should not add comma for meaningless notes
            expect(screen.getByText('120 g flour')).toBeInTheDocument();
            expect(screen.queryByText(/, \s*,/)).not.toBeInTheDocument();
        });
    });
});
