import type {IRecipeNutrition} from './IRecipeNutrition';

// Recipe interface following Google's structured data guidelines
// https://developers.google.com/search/docs/appearance/structured-data/recipe
// https://schema.org/Recipe

interface IRecipe {
    // Firestore metadata
    id?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;

    // Required properties for Google structured data
    name: string;                       // Recipe name
    image: string | string[];           // Image URL(s) or Firebase Storage paths

    // Highly recommended properties
    description?: string;               // Recipe description
    recipeIngredient: string[];         // List of ingredients
    recipeInstructions: string[];       // Step-by-step instructions
    recipeYield?: string;               // Serving size (e.g., "6 servings", "Makes 12 cookies")

    // Time properties (ISO 8601 duration format: PT30M = 30 minutes, PT1H30M = 1.5 hours)
    prepTime?: string;                  // Preparation time
    cookTime?: string;                  // Cooking time
    totalTime?: string;                 // Total time (prep + cook)

    // Nutrition information
    nutrition?: IRecipeNutrition;

    // Categorization and discovery
    recipeCategory?: string[];          // Categories (e.g., "Dessert", "Appetizer", "Main Course")
    recipeCuisine?: string[];           // Cuisine types (e.g., "Italian", "Mexican", "Asian")
    keywords?: string[];                // Keywords for search (e.g., "quick", "easy", "vegetarian")

    // Additional optional properties
    author?: string;                    // Recipe author
    datePublished?: Date;               // Publication date
    aggregateRating?: {                 // User ratings
        ratingValue: number;
        ratingCount: number;
    };
    suitableForDiet?: string[];         // Dietary restrictions (e.g., "GlutenFreeDiet", "VeganDiet")

    // Image upload metadata
    imageSource?: 'upload' | 'url';     // How the image was added
}

export type { IRecipe };
