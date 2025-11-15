/**
 * Unit tests for IngredientForm component
 */

import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {IngredientForm} from '../IngredientForm.tsx';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';
import {ChakraProvider, defaultSystem} from '@chakra-ui/react';

// Wrapper for Chakra UI components
const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider value={defaultSystem}>{component}</ChakraProvider>);
};

describe('IngredientForm', () => {
    afterEach(() => {
        cleanup();
    });

    const mockIngredient: ParsedIngredient = {
        originalText: '2 cups all-purpose flour',
        quantity: 2,
        unit: 'cup', // Canonical form
        ingredientName: 'all-purpose flour',
        preparationNotes: null,
        metricQuantity: '240',
        metricUnit: 'g',
        confidence: 0.95,
        parsingMethod: 'ai',
        requiresManualReview: false,
    };

    describe('Edit Mode', () => {
        describe('Form Rendering', () => {
            it('should render all form fields with ingredient data', () => {
                renderWithChakra(
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
                    />
                );

                // Check that fields are populated
                expect(screen.getByDisplayValue('2')).toBeInTheDocument();
                expect(screen.getByDisplayValue('cup')).toBeInTheDocument(); // Canonical form
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
                    <IngredientForm
                        ingredient={emptyIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
                    />
                );

                expect(screen.getByDisplayValue('salt to taste')).toBeInTheDocument();
                // Quantity input should be empty (check by label)
                const quantityInput = screen.getByLabelText(/quantity/i);
                expect(quantityInput).toHaveValue(null);
            });

            it('should show "Save Changes" button text in edit mode', () => {
                renderWithChakra(
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
                    />
                );

                expect(screen.getByRole('button', {name: /save changes/i})).toBeInTheDocument();
            });
        });

        describe('Form Interaction', () => {
            it('should update quantity field on user input', async () => {
                const user = userEvent.setup();

                renderWithChakra(
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
                    />
                );

                const unitSelect = screen.getByDisplayValue('cup'); // Canonical form
                await user.selectOptions(unitSelect, 'tbsp');

                expect(unitSelect).toHaveValue('tbsp');
            });

            it('should update ingredient name on user input', async () => {
                const user = userEvent.setup();

                renderWithChakra(
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    originalText: '2 cup whole wheat flour', // Uses display label (canonical form)
                    quantity: '2', // quantity goes through string input so becomes string
                    unit: 'cup', // Canonical form
                    ingredientName: 'whole wheat flour',
                    metricQuantity: null, // cups are NOT converted (ratios preserved)
                    metricUnit: null,
                    parsingMethod: 'manual',
                    confidence: 1.0,
                    requiresManualReview: false,
                });
            });

            it('should set parsingMethod to "manual" on save', async () => {
                const user = userEvent.setup();
                const mockOnSave = vi.fn();

                renderWithChakra(
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="edit"
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
                    <IngredientForm
                        ingredient={mockIngredient}
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="edit"
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
    });

    describe('Create Mode', () => {
        describe('Form Rendering', () => {
            it('should render empty form fields in create mode', () => {
                renderWithChakra(
                    <IngredientForm
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="create"
                    />
                );

                // Check that fields are empty
                const quantityInput = screen.getByLabelText(/quantity/i);
                const nameInput = screen.getByLabelText(/ingredient name/i);

                expect(quantityInput).toHaveValue(null);
                expect(nameInput).toHaveValue('');
            });

            it('should show "Add Ingredient" button text in create mode', () => {
                renderWithChakra(
                    <IngredientForm
                        onSave={vi.fn()}
                        onCancel={vi.fn()}
                        mode="create"
                    />
                );

                expect(screen.getByRole('button', {name: /add ingredient/i})).toBeInTheDocument();
            });
        });

        describe('Save Behavior', () => {
            it('should create new ingredient with manual parsing flags', async () => {
                const user = userEvent.setup();
                const mockOnSave = vi.fn();

                renderWithChakra(
                    <IngredientForm
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="create"
                    />
                );

                // Fill in the form
                const quantityInput = screen.getByLabelText(/quantity/i);
                const unitSelect = screen.getByLabelText(/unit/i);
                const nameInput = screen.getByLabelText(/ingredient name/i);
                const notesInput = screen.getByPlaceholderText('chopped, diced, softened');

                await user.type(quantityInput, '1');
                await user.selectOptions(unitSelect, 'cup');
                await user.type(nameInput, 'sugar');
                await user.type(notesInput, 'granulated');

                // Click save
                const saveButton = screen.getByRole('button', {name: /add ingredient/i});
                await user.click(saveButton);

                // Verify onSave was called with correct data
                expect(mockOnSave).toHaveBeenCalledWith(
                    expect.objectContaining({
                        originalText: '1 cup sugar (granulated)',
                        quantity: '1',
                        unit: 'cup',
                        ingredientName: 'sugar',
                        preparationNotes: 'granulated',
                        parsingMethod: 'manual',
                        confidence: 1.0,
                        requiresManualReview: false,
                    })
                );
            });

            it('should handle ingredient without quantity (defaults to "each" unit)', async () => {
                const user = userEvent.setup();
                const mockOnSave = vi.fn();

                renderWithChakra(
                    <IngredientForm
                        onSave={mockOnSave}
                        onCancel={vi.fn()}
                        mode="create"
                    />
                );

                // Fill in only name (unit defaults to 'each')
                const nameInput = screen.getByLabelText(/ingredient name/i);
                await user.type(nameInput, 'salt to taste');

                // Click save
                const saveButton = screen.getByRole('button', {name: /add ingredient/i});
                await user.click(saveButton);

                // Verify onSave was called with correct data
                expect(mockOnSave).toHaveBeenCalledWith(
                    expect.objectContaining({
                        originalText: 'salt to taste', // 'each' is not included in text
                        quantity: null,
                        unit: 'each', // Defaults to 'each'
                        ingredientName: 'salt to taste',
                        preparationNotes: null,
                        parsingMethod: 'manual',
                        confidence: 1.0,
                        requiresManualReview: false,
                    })
                );
            });
        });
    });

    describe('Cancel Behavior', () => {
        it('should call onCancel when cancel button is clicked', async () => {
            const user = userEvent.setup();
            const mockOnCancel = vi.fn();

            renderWithChakra(
                <IngredientForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={mockOnCancel}
                    mode="edit"
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
                <IngredientForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                    mode="edit"
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
                <IngredientForm
                    ingredient={mockIngredient}
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                    mode="edit"
                />
            );

            const nameInput = screen.getByDisplayValue('all-purpose flour');
            await user.clear(nameInput);
            await user.type(nameInput, 'flour');

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            expect(saveButton).not.toBeDisabled();
        });

        it('should disable add button in create mode when name is invalid', async () => {
            const user = userEvent.setup();

            renderWithChakra(
                <IngredientForm
                    onSave={vi.fn()}
                    onCancel={vi.fn()}
                    mode="create"
                />
            );

            const nameInput = screen.getByLabelText(/ingredient name/i);
            await user.type(nameInput, 'a');

            const saveButton = screen.getByRole('button', {name: /add ingredient/i});
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Handle Null Values', () => {
        it('should handle null quantity by converting to empty string', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                    mode="edit"
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

        it('should default to "each" unit when changed', async () => {
            const user = userEvent.setup();
            const mockOnSave = vi.fn();

            renderWithChakra(
                <IngredientForm
                    ingredient={mockIngredient}
                    onSave={mockOnSave}
                    onCancel={vi.fn()}
                    mode="edit"
                />
            );

            const unitSelect = screen.getByDisplayValue('cup'); // Canonical form
            await user.selectOptions(unitSelect, 'each');

            const saveButton = screen.getByRole('button', {name: /save changes/i});
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    unit: 'each',
                })
            );
        });
    });
});
