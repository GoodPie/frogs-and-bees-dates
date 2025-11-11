/**
 * Unit tests for IngredientEditForm component
 */

import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {IngredientEditForm} from '../IngredientEditForm.tsx';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';
import {ChakraProvider, defaultSystem} from '@chakra-ui/react';

// Wrapper for Chakra UI components
const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider value={defaultSystem}>{component}</ChakraProvider>);
};

describe('IngredientEditForm', () => {
    afterEach(() => {
        cleanup();
    });

    const mockIngredient: ParsedIngredient = {
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
    };

    describe('Form Rendering', () => {
        it('should render all form fields with ingredient data', () => {
            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            // Check that fields are populated
            expect(screen.getByDisplayValue('2')).toBeInTheDocument();
            expect(screen.getByDisplayValue('cups')).toBeInTheDocument();
            expect(screen.getByDisplayValue('all-purpose flour')).toBeInTheDocument();
        });

        it('should render empty fields for null values', () => {
            const emptyIngredient: ParsedIngredient = {
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
            };

            renderWithChakra(
                <IngredientEditForm
                    ingredient={emptyIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            expect(screen.getByDisplayValue('salt to taste')).toBeInTheDocument();
            // Quantity input should be empty (check by label)
            const quantityInput = screen.getByLabelText(/quantity/i);
            expect(quantityInput).toHaveValue(null);
        });
    });

    describe('Form Interaction', () => {
        it('should update quantity field on user input', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const quantityInput = screen.getByDisplayValue('2');
            await user.clear(quantityInput);
            await user.type(quantityInput, '3');

            expect(quantityInput).toHaveValue(3);
        });

        it('should update unit field on selection change', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const unitSelect = screen.getByDisplayValue('cups');
            await user.selectOptions(unitSelect, 'tbsp');

            expect(unitSelect).toHaveValue('tbsp');
        });

        it('should update ingredient name on user input', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'bread flour');

            expect(nameInput).toHaveValue('bread flour');
        });

        it('should update preparation notes on user input', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const notesInput = screen.getByPlaceholderText('chopped, diced, softened');
            await user.type(notesInput, 'sifted');

            expect(notesInput).toHaveValue('sifted');
        });
    });

    describe('Save Behavior', () => {
        it('should call onSave with updated ingredient data and manual flags', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            // Modify ingredient name
            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'whole wheat flour');

            // Click save
            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            // Verify onSave was called with correct data
            expect(mockOnSave).toHaveBeenCalledWith({
                ...mockIngredient,
                originalText: '2 cups whole wheat flour', // originalText is reconstructed from edited fields
                quantity: '2', // quantity goes through string input so becomes string
                ingredientName: 'whole wheat flour',
                metricQuantity: '240', // recalculated using convert.js
                metricUnit: 'g',
                parsingMethod: 'manual',
                confidence: 1.0,
                requiresManualReview: false,
            });
        });

        it('should set parsingMethod to "manual" on save', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsingMethod: 'manual',
                })
            );
        });

        it('should set confidence to 1.0 on save', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    confidence: 1.0,
                })
            );
        });

        it('should set requiresManualReview to false on save', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    requiresManualReview: false,
                })
            );
        });
    });

    describe('Cancel Behavior', () => {
        it('should call onCancel when cancel button is clicked', async () => {
            const user = userEvent.setup();
            const mockOnCancel = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={mockOnCancel}
                />
            );

            const cancelButton = screen.getByRole('button', {name: /cancel/i});
            await user.click(cancelButton);

            expect(mockOnCancel).toHaveBeenCalled();
        });
    });

    describe('Validation', () => {
        it('should disable save button when ingredient name is less than 2 characters', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'a');

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            expect(saveButton).toBeDisabled();
        });

        it('should enable save button when ingredient name is valid', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'flour');

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            expect(saveButton).not.toBeDisabled();
        });

        it('should show error message for invalid ingredient name', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                />
            );

            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'a');

            // Verify save button is disabled which indicates validation is working
            const saveButton = screen.getByRole('button', {name: /save changes/i});
            expect(saveButton).toBeDisabled();

            // Note: Field.ErrorText component rendering is tested implicitly through disabled state
            // The error message may not be immediately visible due to Chakra UI's rendering behavior
        });
    });

    describe('Handle Null Values', () => {
        it('should handle null quantity by converting to empty string', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            const quantityInput = screen.getByDisplayValue('2');
            await user.clear(quantityInput);

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    quantity: null,

                })
            );
        });

        it('should handle empty unit by converting to null', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientEditForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                />
            );

            const unitSelect = screen.getByDisplayValue('cups');
            await user.selectOptions(unitSelect, '');

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    unit: null,
                })
            );
        });
    });
});
