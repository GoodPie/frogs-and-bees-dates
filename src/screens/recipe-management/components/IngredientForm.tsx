/**
 * IngredientForm Component
 *
 * Provides a form interface for creating or editing parsed ingredient data.
 * Supports two modes:
 * - create: Creating a new ingredient from scratch
 * - edit: Editing an existing parsed ingredient
 *
 * When a user saves an ingredient:
 * - parsingMethod is set to 'manual'
 * - confidence is set to 1.0
 * - requiresManualReview is set to false
 */

import {useState} from 'react';
import {
    Box,
    Button,
    Input,
    VStack,
    HStack,
    Field,
    NativeSelectRoot,
    NativeSelectField,
} from '@chakra-ui/react';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';
import {convertToMetric} from '@/utils/unitConversions.ts';
import {CANONICAL_UNITS, getUnitDisplayLabel, normalizeUnit, type Unit} from '@/constants/units.ts';

export interface IngredientFormProps {
    /** The ingredient to edit (optional - if not provided, creates new ingredient) */
    ingredient?: ParsedIngredient;

    /** Callback when save is clicked */
    onSave: (updatedIngredient: ParsedIngredient) => void;

    /** Callback when cancel is clicked */
    onCancel: () => void;

    /** Mode: 'create' for new ingredient, 'edit' for existing */
    mode?: 'create' | 'edit';
}

/**
 * IngredientForm Component
 *
 * Form for creating or editing parsed ingredient data with validation
 * and automatic confidence/review flag updates.
 */
export function IngredientForm({
    ingredient,
    onSave,
    onCancel,
    mode = 'edit',
}: IngredientFormProps) {
    const [quantity, setQuantity] = useState(ingredient?.quantity?.toString() || '');
    const [unit, setUnit] = useState(ingredient?.unit || 'each'); // Default to 'each'
    const [ingredientName, setIngredientName] = useState(ingredient?.ingredientName || '');
    const [preparationNotes, setPreparationNotes] = useState(ingredient?.preparationNotes || '');

    const handleSave = () => {
        // Normalize unit to canonical form (always has a value, defaults to 'each')
        const normalizedUnit = normalizeUnit(unit);

        // Reconstruct originalText from edited fields (use display label for unit)
        const parts: string[] = [];
        if (quantity.trim()) parts.push(quantity.trim());
        // Only include unit in text if it's not 'each' (the default/implicit unit)
        if (normalizedUnit !== 'each') {
            parts.push(getUnitDisplayLabel(normalizedUnit));
        }
        parts.push(ingredientName);
        if (preparationNotes) parts.push(`(${preparationNotes})`);
        const reconstructedOriginalText = parts.join(' ');

        // Recalculate metric conversions using the conversion utility
        const conversion = convertToMetric(
            quantity.trim() || null,
            normalizedUnit
        );

        // Create updated ingredient with manual edit flags
        const updatedIngredient: ParsedIngredient = {
            ...(ingredient || {}),
            originalText: reconstructedOriginalText,
            quantity: quantity.trim() || null,
            unit: normalizedUnit,
            ingredientName,
            preparationNotes: preparationNotes || null,
            metricQuantity: conversion.metricQuantity,
            metricUnit: conversion.metricUnit,
            // Set flags for manual edit
            parsingMethod: 'manual',
            confidence: 1.0,
            requiresManualReview: false,
        };

        onSave(updatedIngredient);
    };

    const isValid = ingredientName.trim().length >= 2;

    return (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor="gray.200" _dark={{borderColor: 'gray.700'}}>
            <VStack align="stretch" gap={4}>
                <Field.Root>
                    <Field.Label>Quantity</Field.Label>
                    <Input
                        type="number"
                        step="any"
                        placeholder="2"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <Field.HelperText>
                        Numeric value (e.g., 2, 0.5, 1.25). Leave empty for "to taste" ingredients.
                    </Field.HelperText>
                </Field.Root>

                <Field.Root>
                    <Field.Label>Unit</Field.Label>
                    <NativeSelectRoot>
                        <NativeSelectField
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        >
                            {CANONICAL_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {getUnitDisplayLabel(u)}
                                </option>
                            ))}
                        </NativeSelectField>
                    </NativeSelectRoot>
                    <Field.HelperText>
                        Measurement unit (defaults to "each" for countable items).
                    </Field.HelperText>
                </Field.Root>

                <Field.Root required>
                    <Field.Label>Ingredient Name</Field.Label>
                    <Input
                        placeholder="all-purpose flour"
                        value={ingredientName}
                        onChange={(e) => setIngredientName(e.target.value)}
                        required
                    />
                    <Field.HelperText>
                        Name of the ingredient (required, minimum 2 characters)
                    </Field.HelperText>
                    {ingredientName.length > 0 && ingredientName.length < 2 && (
                        <Field.ErrorText>
                            Ingredient name must be at least 2 characters
                        </Field.ErrorText>
                    )}
                </Field.Root>

                <Field.Root>
                    <Field.Label>Preparation Notes</Field.Label>
                    <Input
                        placeholder="chopped, diced, softened"
                        value={preparationNotes}
                        onChange={(e) => setPreparationNotes(e.target.value)}
                    />
                    <Field.HelperText>
                        Additional preparation instructions (optional)
                    </Field.HelperText>
                </Field.Root>

                <HStack justify="flex-end" gap={2} pt={2}>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSave} disabled={!isValid}>
                        {mode === 'create' ? 'Add Ingredient' : 'Save Changes'}
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}
