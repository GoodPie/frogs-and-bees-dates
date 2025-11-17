import type {
    ScaledInstruction,
    IngredientReference,
    ScaledIngredient,
} from '../types/Recipe';

/**
 * Represents a segment of instruction text for rendering
 */
export interface InstructionSegment {
    /** Type of segment */
    type: 'text' | 'scaled';
    /** Text content to display */
    content: string;
    /** Original quantity before scaling (for 'scaled' type) */
    originalQuantity?: string;
    /** Scaled quantity after scaling (for 'scaled' type) */
    scaledQuantity?: string;
    /** Unit if present (for 'scaled' type) */
    unit?: string | null;
    /** Ingredient name (for 'scaled' type) */
    ingredientName?: string;
}

/**
 * Parse an instruction with scaling information into renderable segments
 *
 * @param instruction - The scaled instruction with references
 * @param scaledIngredients - The list of scaled ingredients for quantity lookup
 * @returns Array of segments with inline scaling metadata
 */
export function parseInstructionWithScaling(
    instruction: ScaledInstruction,
    scaledIngredients: ScaledIngredient[]
): InstructionSegment[] {
    // If no scaling occurred, return as single text segment
    if (!instruction.wasScaled || instruction.references.length === 0) {
        return [
            {
                type: 'text',
                content: instruction.scaled,
                ingredientName: instruction.references[0]?.ingredientName
            },
        ];
    }

    const segments: InstructionSegment[] = [];
    const scaledText = instruction.scaled;
    const references = instruction.references;

    // Sort references by position to process in order
    const sortedRefs = [...references].sort((a, b) => a.startIndex - b.startIndex);

    let currentIndex = 0;

    for (const ref of sortedRefs) {

        // Find the corresponding scaled ingredient for quantity info
        const scaledIngredient = findScaledIngredient(ref, scaledIngredients);

        // Calculate actual position in scaled text
        // Note: Scaling may change text length, so we need to find the ingredient mention
        const refPosition = findReferenceInScaledText(scaledText, ref, currentIndex);

        if (refPosition === null) {
            // Could not locate reference in scaled text, skip
            continue;
        }

        const { start, end, matchedText } = refPosition;

        // Add text before this reference (if any)
        if (start > currentIndex) {
            segments.push({
                type: 'text',
                content: scaledText.substring(currentIndex, start)
            });
        }

        // Add the scaled ingredient reference
        segments.push({
            type: 'scaled',
            content: matchedText,
            originalQuantity: ref.originalQuantity,
            scaledQuantity: scaledIngredient?.displayQuantity || ref.originalQuantity,
            unit: ref.unit,
            ingredientName: ref.ingredientName,
        });

        currentIndex = end;
    }

    // Add remaining text after last reference
    if (currentIndex < scaledText.length) {
        segments.push({
            type: 'text',
            content: scaledText.substring(currentIndex)
        });
    }

    return segments;
}

/**
 * Find the scaled ingredient that matches the reference
 */
function findScaledIngredient(
    ref: IngredientReference,
    scaledIngredients: ScaledIngredient[]
): ScaledIngredient | undefined {
    return scaledIngredients.find(si => {

        const ingredientName = si.original.ingredientName.toLowerCase();
        const refName = ref.ingredientName.toLowerCase();

        // Exact match
        if (ingredientName === refName) return true;

        // Partial match
        return ingredientName.includes(refName) || refName.includes(ingredientName);
    });
}

/**
 * Find the position of a reference in the scaled text
 *
 * Since scaling changes text length, we can't rely on original indices.
 * Instead, we search for the ingredient name + quantity pattern starting from currentIndex.
 */
function findReferenceInScaledText(
    scaledText: string,
    ref: IngredientReference,
    startFrom: number
): { start: number; end: number; matchedText: string } | null {
    // Build a regex pattern to find the reference
    // Pattern: optional formatting + quantity + optional unit + optional preposition + ingredient name
    const ingredientPattern = ref.ingredientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build unit pattern - use ref.unit if available, otherwise match common units
    // Handle both singular and plural forms (e.g., "cup" and "cups")
    let unitPattern: string;
    if (ref.unit) {
        const escapedUnit = ref.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Remove trailing 's' if present, then match with optional 's' at end
        const baseUnit = escapedUnit.replace(/s$/, '');
        unitPattern = `\\s*${baseUnit}s?`;
    } else {
        unitPattern = '\\s*(?:cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|tbsp|tsp|g|kg|ml|l|oz|lb|pound|pounds)?';
    }

    // Look for the scaled quantity followed by unit, optional preposition, then ingredient
    // We need to be flexible since quantity might have changed format
    const pattern = new RegExp(
        `(\\*{0,2})(\\d+(?:[\\s/]\\d+)?|\\d+\\.\\d+|\\d+½|\\d+¼|\\d+¾)${unitPattern}\\s*(?:of\\s+|with\\s+)?${ingredientPattern}s?(\\*{0,2})`,
        'i'
    );

    const searchText = scaledText.substring(startFrom);
    const match = searchText.match(pattern);

    if (!match) {
        return null;
    }

    const matchStart = startFrom + (match.index || 0);
    const matchEnd = matchStart + match[0].length;

    return {
        start: matchStart,
        end: matchEnd,
        matchedText: match[0],
    };
}
