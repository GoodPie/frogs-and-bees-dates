/**
 * IngredientList Component
 *
 * Displays a list of parsed ingredients with support for multiple display modes:
 * - original: Shows the original ingredient text as imported
 * - metric: Shows structured format with metric measurements
 * - imperial: Shows structured format with imperial measurements
 */

import {Box, HStack, Text, Badge, VStack} from '@chakra-ui/react';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';

export type DisplayMode = 'original' | 'metric' | 'imperial';

export interface IngredientListProps {
    /** Array of parsed ingredients to display */
    ingredients: ParsedIngredient[];

    /** Display mode for ingredients */
    displayMode: DisplayMode;

    /** Optional callback when an ingredient is clicked for editing */
    onEditIngredient?: (index: number, ingredient: ParsedIngredient) => void;
}

/**
 * Formats an ingredient for display based on the selected mode
 */
function formatIngredient(ingredient: ParsedIngredient, mode: DisplayMode): string {
    switch (mode) {
        case 'original':
            return ingredient.originalText;

        case 'metric':
            if (ingredient.metricQuantity && ingredient.metricUnit) {
                const base = `${ingredient.metricQuantity} ${ingredient.metricUnit} ${ingredient.ingredientName}`;
                return ingredient.preparationNotes
                    ? `${base}, ${ingredient.preparationNotes}`
                    : base;
            }
            // Fallback to original if no metric conversion available
            return ingredient.originalText;

        case 'imperial':
            if (ingredient.quantity && ingredient.unit) {
                const base = `${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredientName}`;
                return ingredient.preparationNotes
                    ? `${base}, ${ingredient.preparationNotes}`
                    : base;
            }
            // Fallback to original if no quantity/unit
            return ingredient.originalText;

        default:
            return ingredient.originalText;
    }
}

/**
 * IngredientList Component
 *
 * Displays parsed ingredients with various view modes and visual indicators
 * for ingredients that require manual review.
 */
export function IngredientList({
    ingredients,
    displayMode,
    onEditIngredient,
}: IngredientListProps) {
    if (!ingredients || ingredients.length === 0) {
        return (
            <Box p={4} textAlign="center" color="gray.500">
                <Text>No ingredients to display</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" gap={2}>
            {ingredients.map((ingredient, index) => (
                <HStack
                    key={index}
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    bg={ingredient.requiresManualReview ? 'orange.50' : 'gray.50'}
                    _dark={{
                        bg: ingredient.requiresManualReview ? 'orange.900' : 'gray.800',
                    }}
                    cursor={onEditIngredient ? 'pointer' : 'default'}
                    onClick={() => onEditIngredient?.(index, ingredient)}
                    _hover={onEditIngredient ? {
                        bg: ingredient.requiresManualReview ? 'orange.100' : 'gray.100',
                        _dark: {
                            bg: ingredient.requiresManualReview ? 'orange.800' : 'gray.700',
                        }
                    } : undefined}
                    transition="background-color 0.2s"
                >
                    <Text flex={1} fontSize="sm">
                        {formatIngredient(ingredient, displayMode)}
                    </Text>

                    <HStack gap={2}>
                        {ingredient.requiresManualReview && (
                            <Badge colorScheme="orange" size="sm" variant="subtle">
                                Review
                            </Badge>
                        )}

                        {ingredient.parsingMethod === 'manual' && (
                            <Badge colorScheme="blue" size="sm" variant="subtle">
                                Edited
                            </Badge>
                        )}

                        {displayMode === 'metric' && ingredient.metricQuantity && (
                            <Badge colorScheme="green" size="sm" variant="outline">
                                Metric
                            </Badge>
                        )}
                    </HStack>
                </HStack>
            ))}
        </VStack>
    );
}
