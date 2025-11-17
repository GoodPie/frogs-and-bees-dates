import type {
    ScaledIngredient,
    IngredientReference,
    ScaledInstruction,
    InstructionScalingOptions,
} from '../types/Recipe';
import pluralize from 'pluralize';

/**
 * Default options for instruction scaling
 */
export const DEFAULT_OPTIONS: InstructionScalingOptions = {
    preserveFormatting: true,
    useFractionSymbols: true,
    scaleToTaste: false,
    matchConfidenceThreshold: 0.7,
    logWarnings: import.meta.env.DEV,
    maxReferencesPerInstruction: 20,
};

/**
 * Patterns that indicate non-scalable ingredients
 */
export const OPT_OUT_PATTERNS = [
    /to taste$/i,
    /as needed$/i,
    /for garnish$/i,
    /optional$/i,
    /^garnish with/i,
    /^season with/i,
];

/**
 * Main entry point: Scale all instructions for a recipe
 */
export function scaleInstructions(
    instructions: string[],
    scaledIngredients: ScaledIngredient[],
    options: Partial<InstructionScalingOptions> = {}
): ScaledInstruction[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return instructions.map(instruction =>
        scaleInstructionText(instruction, scaledIngredients, opts)
    );
}

/**
 * Scale a single instruction
 */
export function scaleInstructionText(
    instruction: string,
    scaledIngredients: ScaledIngredient[],
    options: Partial<InstructionScalingOptions> = {}
): ScaledInstruction {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Find all ingredient references
    const ingredientNames = scaledIngredients.map(si => si.original.ingredientName);
    const references = findIngredientReferences(instruction, ingredientNames, opts);

    // Filter to matched references only
    const matchedRefs = references.filter(ref => ref.isMatched);

    if (matchedRefs.length === 0) {
        return {
            original: instruction,
            scaled: instruction,
            wasScaled: false,
            referenceCount: 0,
            references: [],
            warnings: [],
        };
    }

    // Replace quantities with scaled values
    let scaledText = instruction;
    const warnings: string[] = [];

    // Process in reverse order to avoid index shifting
    for (let i = matchedRefs.length - 1; i >= 0; i--) {
        const ref = matchedRefs[i];

        // Find corresponding scaled ingredient
        const scaledIngredient = scaledIngredients.find(si =>
            matchIngredient(ref.ingredientName, si.original.ingredientName)
        );

        if (!scaledIngredient || scaledIngredient.scaledQuantity === null) {
            warnings.push(`Could not scale ${ref.ingredientName}`);
            continue;
        }

        // Get formatted quantity - use displayQuantity from ScaledIngredient for consistency
        const newQuantity = scaledIngredient.displayQuantity || scaledIngredient.scaledQuantity?.toString() || '0';

        // Replace in text
        scaledText = replaceQuantityInText(scaledText, ref, newQuantity, opts);
    }

    return {
        original: instruction,
        scaled: scaledText,
        wasScaled: scaledText !== instruction,
        referenceCount: matchedRefs.length,
        references: matchedRefs,
        warnings,
    };
}

/**
 * Find all ingredient references in instruction text
 */
export function findIngredientReferences(
    instruction: string,
    ingredientNames: string[],
    options: Partial<InstructionScalingOptions> = {}
): IngredientReference[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const references: IngredientReference[] = [];

    for (const ingredientName of ingredientNames) {
        // Skip if ingredient name is empty or undefined
        if (!ingredientName || typeof ingredientName !== 'string') {
            continue;
        }

        // Build regex pattern for this ingredient
        // Matches: [formatting] [quantity] [unit?] [ingredient] [formatting]
        const escapedName = ingredientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Pattern matches:
        // - Optional markdown formatting (**, *)
        // - Quantity (whole number, decimal, or fraction)
        // - Optional unit (cup, cups, tbsp, etc.)
        // - Optional preposition (of, with)
        // - Ingredient name (with optional plural 's')
        // - Optional markdown formatting
        const pattern = new RegExp(
            `(\\*{0,2})(\\d+(?:[/.\\s]\\d+)?|\\d+\\.\\d+)\\s*(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|g|kg|ml|l|oz|lb|pound|pounds)?\\s*(?:of\\s+|with\\s+)?${escapedName}s?(\\*{0,2})`,
            'gi'
        );

        let match;
        while ((match = pattern.exec(instruction)) !== null) {
            const fullMatch = match[0];
            const preFormat = match[1];
            const quantity = match[2];
            const unit = match[3] || null;
            const postFormat = match[4];

            // Check if this should be scaled
            const shouldSkip = OPT_OUT_PATTERNS.some(p => p.test(fullMatch));
            if (!opts.scaleToTaste && shouldSkip) {
                continue;
            }

            references.push({
                fullMatch,
                ingredientName,
                originalQuantity: quantity,
                unit,
                preFormat,
                postFormat,
                startIndex: match.index,
                endIndex: match.index + fullMatch.length,
                isMatched: true,
                // matchedIngredient will be filled later
            });

            // Limit references per instruction
            if (references.length >= opts.maxReferencesPerInstruction) {
                if (opts.logWarnings) {
                    console.warn(`Max references (${opts.maxReferencesPerInstruction}) reached for instruction`);
                }
                return references;
            }
        }
    }

    return references.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Match ingredient name (handles plural/singular)
 */
export function matchIngredient(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    // Exact match
    if (n1 === n2) return true;

    // Plural/singular match
    const singular1 = pluralize.singular(n1);
    const singular2 = pluralize.singular(n2);
    if (singular1 === singular2) return true;

    // Partial match
    return n1.includes(n2) || n2.includes(n1);
}

/**
 * Replace quantity in text while preserving formatting
 */
export function replaceQuantityInText(
    text: string,
    reference: IngredientReference,
    newQuantity: string,
    options: Partial<InstructionScalingOptions> = {}
): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { fullMatch, originalQuantity, startIndex, unit, ingredientName } = reference;

    // Simply replace the quantity in the matched text
    let newText = fullMatch.replace(originalQuantity, newQuantity);

    // Parse quantity for singular/plural logic
    const qty = parseFloat(newQuantity.replace(/[^\d.]/g, '')); // Remove non-numeric chars except decimal

    // Handle singular/plural units based on new quantity
    if (unit && opts.preserveFormatting && !isNaN(qty)) {
        // Skip pluralization for abbreviations (e.g., tbsp, tsp, oz, lb, g, kg, ml, l)
        const isAbbreviation = /^[a-z]{1,4}$/i.test(unit) && !['cup', 'cups'].includes(unit.toLowerCase());

        if (!isAbbreviation) {
            let adjustedUnit: string;
            // Singularize units for quantity of 1, pluralize otherwise
            if (qty === 1) {
                adjustedUnit = pluralize.singular(unit);
            } else {
                adjustedUnit = pluralize.plural(unit);
            }

            // Replace unit if it changed
            if (adjustedUnit !== unit) {
                newText = newText.replace(new RegExp(`\\b${unit}\\b`, 'i'), adjustedUnit);
            }
        }
    }

    // Handle singular/plural ingredient names based on new quantity
    // Only for countable ingredients with regular plural forms (add 's')
    if (ingredientName && opts.preserveFormatting && !isNaN(qty)) {
        const singularName = pluralize.singular(ingredientName);

        // List of common uncountable ingredients (mass nouns) that should NOT be pluralized
        const uncountableIngredients = new Set(['flour', 'sugar', 'salt', 'pepper', 'butter', 'milk', 'water', 'rice', 'cheese', 'bread']);

        // Skip uncountable ingredients
        if (!uncountableIngredients.has(singularName.toLowerCase())) {
            // Check if the matched text contains the ingredient
            const pluralPattern = new RegExp(`\\b${singularName}s\\b`, 'i');
            const singularPattern = new RegExp(`\\b${singularName}\\b`, 'i');

            if (qty === 1 && pluralPattern.test(newText)) {
                // Change "eggs" to "egg" when quantity is 1
                newText = newText.replace(pluralPattern, singularName);
            } else if (qty !== 1 && singularPattern.test(newText) && !newText.match(pluralPattern)) {
                // Change "egg" to "eggs" when quantity > 1
                newText = newText.replace(singularPattern, `${singularName}s`);
            }
        }
    }

    // Replace in original text
    return (
        text.substring(0, startIndex) +
        newText +
        text.substring(startIndex + fullMatch.length)
    );
}
