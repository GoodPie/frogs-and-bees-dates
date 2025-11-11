/**
 * IngredientList Component
 *
 * Displays a list of parsed ingredients with support for multiple display modes:
 * - original: Shows the original ingredient text as imported
 * - metric: Shows structured format with metric measurements
 * - imperial: Shows structured format with imperial measurements
 */

import {Box, HStack, Text, Badge, VStack} from '@chakra-ui/react';
import {AiOutlineWarning} from 'react-icons/ai';
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
    // Helper to clean ingredient name (remove trailing commas/periods)
    // Using iterative approach to prevent ReDoS vulnerability
    const cleanName = (name: string) => {
        let cleaned = name.trim();
        while (cleaned.length > 0 && /[,.\s]/.test(cleaned[cleaned.length - 1])) {
            cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
    };

    // Helper to check if preparation notes are meaningful
    // Using iterative approach to prevent ReDoS vulnerability
    const hasPreparationNotes = (notes: string | null) => {
        if (!notes) return false;
        const trimmed = notes.trim();
        // Check if there's any character that's not comma, period, or whitespace
        for (let i = 0; i < trimmed.length; i++) {
            if (!/[,.\s]/.test(trimmed[i])) {
                return true;
            }
        }
        return false;
    };

    switch (mode) {
        case 'original':
            return ingredient.originalText;

        case 'metric':
            if (ingredient.metricQuantity && ingredient.metricUnit) {
                const cleanedName = cleanName(ingredient.ingredientName);
                const base = `${ingredient.metricQuantity} ${ingredient.metricUnit} ${cleanedName}`;
                return hasPreparationNotes(ingredient.preparationNotes)
                    ? `${base}, ${ingredient.preparationNotes?.trim()}`
                    : base;
            }
            // Fallback to original if no metric conversion available
            return ingredient.originalText;

        case 'imperial':
            if (ingredient.quantity && ingredient.unit) {
                const cleanedName = cleanName(ingredient.ingredientName);
                const base = `${ingredient.quantity} ${ingredient.unit} ${cleanedName}`;
                return hasPreparationNotes(ingredient.preparationNotes)
                    ? `${base}, ${ingredient.preparationNotes?.trim()}`
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

                        {/* Show warning badge for low confidence (< 0.7) */}
                        {ingredient.confidence < 0.7 && ingredient.parsingMethod !== 'manual' && (
                            <Badge colorScheme="red" size="sm" variant="subtle">
                                <HStack gap={1}>
                                    <AiOutlineWarning />
                                    <Text>Low Confidence</Text>
                                </HStack>
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
