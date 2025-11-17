import type {
    ScalingExclusion,
    StructuredInstruction,
    IngredientRefSegment,
} from '../types/Recipe';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

/**
 * Generate unique ID for exclusion
 */
function generateExclusionId(): string {
    return `exclusion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new scaling exclusion
 * @param stepNumber - The step number (1-based)
 * @param excludedText - The exact text being excluded (e.g., "2 cups flour")
 * @param ingredientName - The ingredient name
 * @returns New ScalingExclusion object
 */
export function createExclusion(
    stepNumber: number,
    excludedText: string,
    ingredientName: string
): ScalingExclusion {
    return {
        id: generateExclusionId(),
        stepNumber,
        excludedText,
        ingredientName,
        createdAt: Date.now(),
    };
}

/**
 * Add an exclusion to a recipe in Firestore
 * @param recipeId - The recipe document ID
 * @param exclusion - The exclusion to add
 */
export async function addExclusionToRecipe(
    recipeId: string,
    exclusion: ScalingExclusion
): Promise<void> {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, {
        scalingExclusions: arrayUnion(exclusion),
    });
}

/**
 * Remove an exclusion from a recipe in Firestore
 * @param recipeId - The recipe document ID
 * @param exclusion - The exclusion to remove
 */
export async function removeExclusionFromRecipe(
    recipeId: string,
    exclusion: ScalingExclusion
): Promise<void> {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, {
        scalingExclusions: arrayRemove(exclusion),
    });
}

/**
 * Apply exclusions to parsed instructions
 * Sets scalingDisabled=true for segments matching exclusions
 * @param instructions - Parsed instructions with segments
 * @param exclusions - Array of scaling exclusions
 * @returns Instructions with exclusions applied
 */
export function applyExclusions(
    instructions: StructuredInstruction[],
    exclusions: ScalingExclusion[]
): StructuredInstruction[] {
    if (!exclusions || exclusions.length === 0) {
        return instructions;
    }

    return instructions.map(instruction => {
        // Find exclusions for this step
        const stepExclusions = exclusions.filter(
            ex => ex.stepNumber === instruction.stepNumber
        );

        if (stepExclusions.length === 0) {
            return instruction;
        }

        // Apply exclusions to segments
        const updatedSegments = instruction.segments.map(segment => {
            if (segment.type !== 'ingredient_ref') {
                return segment;
            }

            // Check if this segment matches any exclusion
            const isExcluded = stepExclusions.some(ex => {
                // Match by exact text
                return (
                    ex.excludedText === segment.originalText &&
                    ex.ingredientName === segment.ingredientName
                );
            });

            if (isExcluded) {
                // Clone segment and set scalingDisabled
                return {
                    ...segment,
                    scalingDisabled: true,
                } as IngredientRefSegment;
            }

            return segment;
        });

        return {
            ...instruction,
            segments: updatedSegments,
        };
    });
}

/**
 * Find all ingredient references in an instruction that can be excluded
 * Useful for building UI to show excludable references
 * @param instruction - Structured instruction
 * @returns Array of ingredient reference segments
 */
export function getExcludableReferences(
    instruction: StructuredInstruction
): IngredientRefSegment[] {
    return instruction.segments.filter(
        segment => segment.type === 'ingredient_ref'
    ) as IngredientRefSegment[];
}

/**
 * Check if a specific reference is currently excluded
 * @param stepNumber - The step number
 * @param originalText - The ingredient reference text
 * @param ingredientName - The ingredient name
 * @param exclusions - Array of current exclusions
 * @returns true if excluded, false otherwise
 */
export function isReferenceExcluded(
    stepNumber: number,
    originalText: string,
    ingredientName: string,
    exclusions: ScalingExclusion[]
): boolean {
    return exclusions.some(
        ex =>
            ex.stepNumber === stepNumber &&
            ex.excludedText === originalText &&
            ex.ingredientName === ingredientName
    );
}

/**
 * Find exclusion for a specific reference
 * @param stepNumber - The step number
 * @param originalText - The ingredient reference text
 * @param ingredientName - The ingredient name
 * @param exclusions - Array of current exclusions
 * @returns The matching exclusion or undefined
 */
export function findExclusionForReference(
    stepNumber: number,
    originalText: string,
    ingredientName: string,
    exclusions: ScalingExclusion[]
): ScalingExclusion | undefined {
    return exclusions.find(
        ex =>
            ex.stepNumber === stepNumber &&
            ex.excludedText === originalText &&
            ex.ingredientName === ingredientName
    );
}
