// Nutrition information following schema.org/NutritionInformation
// https://schema.org/NutritionInformation

interface IRecipeNutrition {
    calories?: string;              // Energy content (e.g., "270 calories")
    carbohydrateContent?: string;   // Carbohydrate content (e.g., "14g")
    proteinContent?: string;        // Protein content (e.g., "3g")
    fatContent?: string;            // Fat content (e.g., "12g")
    saturatedFatContent?: string;   // Saturated fat content (e.g., "7g")
    unsaturatedFatContent?: string; // Unsaturated fat content (e.g., "2g")
    transFatContent?: string;       // Trans fat content (e.g., "0g")
    cholesterolContent?: string;    // Cholesterol content (e.g., "30mg")
    sodiumContent?: string;         // Sodium content (e.g., "110mg")
    fiberContent?: string;          // Fiber content (e.g., "1g")
    sugarContent?: string;          // Sugar content (e.g., "12g")
    servingSize?: string;           // Serving size (e.g., "1 cup")
}

export type { IRecipeNutrition };
