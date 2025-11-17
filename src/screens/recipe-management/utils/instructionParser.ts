import type {
    StructuredInstruction,
    InstructionSegment,
    TextSegment,
    IngredientRefSegment,
} from '../types/Recipe';
import { OPT_OUT_PATTERNS } from './instructionScaling';
import type {ParsedIngredient} from "@/models/ParsedIngredient.ts";

/**
 * Counter for generating unique IDs within the same millisecond
 */
let idCounter = 0;

/**
 * Generate unique ID for instruction
 */
function generateInstructionId(stepNumber: number): string {
    return `instruction-${stepNumber}-${Date.now()}-${idCounter++}`;
}

/**
 * Parse a single instruction into segments
 * @param instruction - The instruction text to parse
 * @param stepNumber - The step number (1-based)
 * @param ingredients - Array of parsed ingredients from the recipe
 * @returns StructuredInstruction with parsed segments
 */
export function parseInstruction(
    instruction: string,
    stepNumber: number,
    ingredients: ParsedIngredient[]
): StructuredInstruction {
    const segments: InstructionSegment[] = [];
    let currentIndex = 0;

    // Build regex pattern for all ingredients
    const ingredientMatches: Array<{
        match: RegExpMatchArray;
        ingredientName: string;
        ingredientIndex: number;
    }> = [];

    // Find all ingredient references in the instruction
    ingredients.forEach((ingredient, index) => {
        const ingredientName = ingredient.ingredientName;
        if (!ingredientName || typeof ingredientName !== 'string') {
            return;
        }

        // Escape special regex characters
        const escapedName = ingredientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Pattern matches:
        // - Quantity (whole number, decimal, or fraction)
        // - Optional unit (cup, cups, tbsp, etc.)
        // - Optional preposition (of, with)
        // - Ingredient name (with optional plural 's')
        const pattern = new RegExp(
            `(\\d+(?:[/.\\s]\\d+)?|\\d+\\.\\d+)\\s*(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|g|kg|ml|l|oz|lb|pound|pounds)?\\s*(?:(of|with)\\s+)?${escapedName}s?`,
            'gi'
        );

        let match;
        while ((match = pattern.exec(instruction)) !== null) {
            // Check if this match should be auto-excluded
            // Check the text from the start of the match to the end of the instruction
            const matchStart = match.index!;
            const textFromMatch = instruction.substring(matchStart);
            const shouldExclude = OPT_OUT_PATTERNS.some(p => p.test(textFromMatch));

            if (!shouldExclude) {
                ingredientMatches.push({
                    match,
                    ingredientName,
                    ingredientIndex: index,
                });
            }
        }
    });

    // Sort matches by start index
    ingredientMatches.sort((a, b) => a.match.index! - b.match.index!);

    // Build segments
    for (const { match, ingredientName, ingredientIndex } of ingredientMatches) {
        const matchStart = match.index!;
        const matchEnd = matchStart + match[0].length;

        // Add text segment before this ingredient reference
        if (matchStart > currentIndex) {
            const textSegment: TextSegment = {
                type: 'text',
                content: instruction.substring(currentIndex, matchStart),
            };
            segments.push(textSegment);
        }

        // Add ingredient reference segment
        const ingredientRefSegment: IngredientRefSegment = {
            type: 'ingredient_ref',
            originalText: match[0],
            ingredientName,
            originalQuantity: match[1],
            unit: match[2] || null,
            preposition: match[3] || null,
            ingredientIndex,
            scalingDisabled: false, // Default to enabled
        };
        segments.push(ingredientRefSegment);

        currentIndex = matchEnd;
    }

    // Add remaining text as final segment
    if (currentIndex < instruction.length) {
        const textSegment: TextSegment = {
            type: 'text',
            content: instruction.substring(currentIndex),
        };
        segments.push(textSegment);
    }

    // If no segments were created, the entire instruction is plain text
    if (segments.length === 0) {
        segments.push({
            type: 'text',
            content: instruction,
        });
    }

    return {
        id: generateInstructionId(stepNumber),
        originalText: instruction,
        segments,
        stepNumber,
    };
}

/**
 * Parse all instructions in a recipe
 * @param instructions - Array of instruction strings
 * @param ingredients - Array of parsed ingredients from the recipe
 * @returns Array of StructuredInstructions
 */
export function parseAllInstructions(
    instructions: string[],
    ingredients: ParsedIngredient[]
): StructuredInstruction[] {
    return instructions.map((instruction, index) =>
        parseInstruction(instruction, index + 1, ingredients)
    );
}

/**
 * Reconstruct instruction text from segments
 * Useful for displaying or debugging
 * @param segments - Array of instruction segments
 * @returns Reconstructed instruction text
 */
export function reconstructInstructionText(segments: InstructionSegment[]): string {
    return segments
        .map(segment => {
            if (segment.type === 'text') {
                return segment.content;
            } else {
                return segment.originalText;
            }
        })
        .join('');
}
