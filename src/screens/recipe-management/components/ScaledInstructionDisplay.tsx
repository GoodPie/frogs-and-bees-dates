import { Text } from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import type { ScaledInstruction, ScaledIngredient } from '../types/Recipe';
import { parseInstructionWithScaling } from '../utils/parseInstructionWithScaling';

interface ScaledInstructionDisplayProps {
    /** The instruction with scaling information */
    instruction: ScaledInstruction;
    /** List of scaled ingredients for quantity lookup */
    scaledIngredients: ScaledIngredient[];
    /** Font size responsive object */
    fontSize?: Record<string, string> | string;
}

/**
 * Display an instruction with inline tooltips for scaled ingredients
 *
 * Scaled ingredients are underlined and show "Scaled from X to Y" on hover
 */
export function ScaledInstructionDisplay({
    instruction,
    scaledIngredients,
    fontSize = { base: 'md', md: 'lg' },
}: ScaledInstructionDisplayProps) {
    const segments = parseInstructionWithScaling(instruction, scaledIngredients);

    return (
        <Text fontSize={fontSize}>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return <span key={index}>{segment.content}</span>;
                }

                // Check if quantity actually changed
                const hasChanged = segment.originalQuantity !== segment.scaledQuantity;

                // If no change, render as plain text without underline
                if (!hasChanged) {
                    return <span key={index}>{segment.content}</span>;
                }

                // Scaled ingredient segment with tooltip
                const tooltipContent = formatTooltipContent(
                    segment.originalQuantity || '',
                    segment.scaledQuantity || '',
                    segment.unit,
                    segment.ingredientName || ''
                );

                return (
                    <Tooltip key={index} content={tooltipContent} showArrow openDelay={200} closeDelay={100}>
                        <Text
                            as="span"
                            textDecoration="underline"
                            textDecorationColor="blue.500"
                            textDecorationStyle="dotted"
                            textDecorationThickness="1px"
                            textUnderlineOffset="2px"
                            cursor="help"
                            _hover={{
                                textDecorationColor: "blue.600",
                                textDecorationStyle: "solid",
                            }}
                        >
                            {segment.content}
                        </Text>
                    </Tooltip>
                );
            })}
        </Text>
    );
}

/**
 * Format the tooltip content for a scaled ingredient
 */
function formatTooltipContent(
    original: string,
    scaled: string,
    unit: string | null | undefined,
    ingredientName: string
): string {
    const unitText = unit ? ` ${unit}` : '';
    const ingredientText = ingredientName ? ` ${ingredientName}` : '';

    // If quantities are the same, show "No change"
    if (original === scaled) {
        return `${original}${unitText}${ingredientText} (no change)`;
    }

    return `Scaled from ${original}${unitText} to ${scaled}${unitText}`;
}
