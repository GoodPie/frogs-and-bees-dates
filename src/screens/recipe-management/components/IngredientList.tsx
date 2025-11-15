/**
 * IngredientList Component
 *
 * Displays a list of parsed ingredients with support for multiple display modes:
 * - original: Shows the original ingredient text as imported
 * - metric: Shows structured format with metric measurements
 * - imperial: Shows structured format with imperial measurements
 */

import {Box, HStack, Text, Badge, VStack, Button, IconButton} from '@chakra-ui/react';
import {AiOutlineWarning} from 'react-icons/ai';
import {FiPlus, FiTrash2} from 'react-icons/fi';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';
import {fractionToDecimal} from "@/services/ingredientParser.ts";
import convert from 'convert';
import {
    isConvertibleWeightUnit,
    isMetricUnit,
    smartRound
} from '@/utils/unitConversions.ts';

export type DisplayMode = 'original' | 'metric' | 'imperial';

export interface IngredientListProps {
    /** Array of parsed ingredients to display */
    ingredients: ParsedIngredient[];

    /** Display mode for ingredients */
    displayMode: DisplayMode;

    /** Optional callback when an ingredient is clicked for editing */
    onEditIngredient?: (index: number, ingredient: ParsedIngredient) => void;

    /** Optional callback when add new ingredient is clicked */
    onAddIngredient?: () => void;

    /** Optional callback when delete ingredient is clicked */
    onDeleteIngredient?: (index: number) => void;

    /** Optional yield multiplier for scaling quantities */
    yieldMultiplier?: number;
}

/**
 * Formats an ingredient for display based on the selected mode
 * Converts units on-the-fly and applies yield scaling
 */
function formatIngredient(ingredient: ParsedIngredient, mode: DisplayMode, yieldMultiplier: number = 1): string {
    // Helper to clean ingredient name (remove trailing commas/periods)
    const cleanName = (name: string) => {
        let cleaned = name.trim();
        while (cleaned.length > 0 && /[,.\s]/.test(cleaned[cleaned.length - 1])) {
            cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
    };

    // Helper to check if preparation notes are meaningful
    const hasPreparationNotes = (notes: string | null) => {
        if (!notes) return false;
        const trimmed = notes.trim();
        for (let i = 0; i < trimmed.length; i++) {
            if (!/[,.\s]/.test(trimmed[i])) {
                return true;
            }
        }
        return false;
    };

    // Original mode - no conversion or scaling
    if (mode === 'original') {
        return ingredient.originalText;
    }

    // If no quantity/unit, return original
    if (!ingredient.quantity) {
        return ingredient.originalText;
    }

    // Parse quantity (handle both string and number)
    let quantity = fractionToDecimal(String(ingredient.quantity));
    if (quantity === null) {
        return ingredient.originalText;
    }

    let unit = ingredient.unit || "each";
    const cleanedName = cleanName(ingredient.ingredientName);

    // Convert weight units ONLY
    if (mode === 'metric' && isConvertibleWeightUnit(unit) && !isMetricUnit(unit)) {
        try {
            if (unit.toLowerCase() === 'oz' || unit.toLowerCase() === 'ounce' || unit.toLowerCase() === 'ounces') {
                quantity = convert(quantity, 'oz').to('g');
                unit = 'g';
            } else if (unit.toLowerCase() === 'lb' || unit.toLowerCase() === 'pound' || unit.toLowerCase() === 'pounds' || unit.toLowerCase() === 'lbs') {
                quantity = convert(quantity, 'lb').to('kg');
                unit = 'kg';
            }
            quantity = smartRound(quantity);
        } catch (e) {
            // Conversion failed, keep original
            console.warn(`Failed to convert ${quantity} ${unit} to metric:`, e);
        }
    } else if (mode === 'imperial' && isConvertibleWeightUnit(unit) && isMetricUnit(unit)) {
        // Metric weight → Imperial (g → oz, kg → lb)
        try {
            if (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gram' || unit.toLowerCase() === 'grams') {
                quantity = convert(quantity, 'g').to('oz');
                unit = 'oz';
            } else if (unit.toLowerCase() === 'kg' || unit.toLowerCase() === 'kilogram' || unit.toLowerCase() === 'kilograms') {
                quantity = convert(quantity, 'kg').to('lb');
                unit = 'lb';
            }
            quantity = smartRound(quantity);
        } catch (e) {
            // Conversion failed, keep original
            console.warn(`Failed to convert ${quantity} ${unit} to imperial:`, e);
        }
    }

    // Apply yield scaling AFTER conversion
    quantity = quantity * yieldMultiplier;

    // Round to 2 decimal places for display
    const displayQty = Math.round(quantity * 100) / 100;

    // Format the ingredient
    const base = `${displayQty} ${unit} ${cleanedName}`;
    return hasPreparationNotes(ingredient.preparationNotes)
        ? `${base}, ${ingredient.preparationNotes?.trim()}`
        : base;
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
    onAddIngredient,
    onDeleteIngredient,
    yieldMultiplier = 1,
}: IngredientListProps) {
    return (
        <VStack align="stretch" gap={2}>
            {(!ingredients || ingredients.length === 0) && (
                <Box p={4} textAlign="center" color="gray.500">
                    <Text>No ingredients yet. Click "Add Ingredient" to get started.</Text>
                </Box>
            )}

            {ingredients && ingredients.map((ingredient, index) => (
                <HStack
                    key={index}
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    bg={ingredient.requiresManualReview ? 'orange.50' : 'gray.50'}
                    _dark={{
                        bg: ingredient.requiresManualReview ? 'orange.900' : 'gray.800',
                    }}
                    transition="background-color 0.2s"
                >
                    <Text
                        flex={1}
                        fontSize="sm"
                        cursor={onEditIngredient ? 'pointer' : 'default'}
                        onClick={() => onEditIngredient?.(index, ingredient)}
                        _hover={onEditIngredient ? {
                            textDecoration: 'underline'
                        } : undefined}
                    >
                        {formatIngredient(ingredient, displayMode, yieldMultiplier)}
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

                        {onDeleteIngredient && (
                            <IconButton
                                aria-label="Delete ingredient"
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteIngredient(index);
                                }}
                            >
                                <FiTrash2 />
                            </IconButton>
                        )}
                    </HStack>
                </HStack>
            ))}

            {onAddIngredient && (
                <Button
                    variant="outline"
                    colorScheme="blue"
                    onClick={onAddIngredient}
                    mt={2}
                >
                    <FiPlus />
                    Add Ingredient
                </Button>
            )}
        </VStack>
    );
}
