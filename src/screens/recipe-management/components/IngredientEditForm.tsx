/**
 * IngredientEditForm Component
 *
 * Provides a form interface for manually editing parsed ingredient data.
 * When a user edits an ingredient:
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

export interface IngredientEditFormProps {
    /** The ingredient to edit */
    ingredient: ParsedIngredient;

    /** Callback when save is clicked */
    onSave: (updatedIngredient: ParsedIngredient) => void;

    /** Callback when cancel is clicked */
    onCancel: () => void;
}

/**
 * Common measurement units for ingredient selection
 */
const COMMON_UNITS = [
    'cup',
    'cups',
    'tbsp',
    'tablespoon',
    'tablespoons',
    'tsp',
    'teaspoon',
    'teaspoons',
    'oz',
    'ounce',
    'ounces',
    'lb',
    'pound',
    'pounds',
    'g',
    'gram',
    'grams',
    'kg',
    'kilogram',
    'kilograms',
    'ml',
    'milliliter',
    'milliliters',
    'l',
    'liter',
    'liters',
    'pinch',
    'dash',
    'clove',
    'cloves',
];

/**
 * IngredientEditForm Component
 *
 * Form for manually editing parsed ingredient data with validation
 * and automatic confidence/review flag updates.
 */
export function IngredientEditForm({
    ingredient,
    onSave,
    onCancel,
}: IngredientEditFormProps) {
    const [quantity, setQuantity] = useState(ingredient.quantity?.toString() || '');
    const [unit, setUnit] = useState(ingredient.unit || '');
    const [ingredientName, setIngredientName] = useState(ingredient.ingredientName);
    const [preparationNotes, setPreparationNotes] = useState(ingredient.preparationNotes || '');

    const handleSave = () => {
        // Create updated ingredient with manual edit flags
        const updatedIngredient: ParsedIngredient = {
            ...ingredient,
            quantity: quantity,
            unit: unit || null,
            ingredientName,
            preparationNotes: preparationNotes || null,
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
                            placeholder="Select unit"
                        >
                            <option value="">None</option>
                            {COMMON_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </NativeSelectField>
                    </NativeSelectRoot>
                    <Field.HelperText>
                        Measurement unit. Can be left empty for items without measurements.
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
                        Save Changes
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}
