import { useEffect } from 'react';
import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";

interface RecipeJsonLdProps {
    recipe: IRecipe;
}

/**
 * Component that generates JSON-LD structured data for recipes
 * Following Google's Recipe structured data guidelines
 * https://developers.google.com/search/docs/appearance/structured-data/recipe
 */
export const RecipeJsonLd = ({ recipe }: RecipeJsonLdProps) => {
    useEffect(() => {
        const structuredData = {
            '@context': 'https://schema.org/',
            '@type': 'Recipe',
            name: recipe.name,
            image: Array.isArray(recipe.image) ? recipe.image : [recipe.image],
            description: recipe.description,
            author: recipe.author ? {
                '@type': 'Person',
                name: recipe.author
            } : undefined,
            datePublished: recipe.datePublished?.toISOString(),
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            totalTime: recipe.totalTime,
            recipeYield: recipe.recipeYield,
            recipeCategory: recipe.recipeCategory,
            recipeCuisine: recipe.recipeCuisine,
            keywords: recipe.keywords?.join(', '),
            recipeIngredient: recipe.recipeIngredient,
            recipeInstructions: recipe.recipeInstructions.map((instruction, index) => ({
                '@type': 'HowToStep',
                position: index + 1,
                text: instruction
            })),
            nutrition: recipe.nutrition ? {
                '@type': 'NutritionInformation',
                calories: recipe.nutrition.calories,
                carbohydrateContent: recipe.nutrition.carbohydrateContent,
                proteinContent: recipe.nutrition.proteinContent,
                fatContent: recipe.nutrition.fatContent,
                saturatedFatContent: recipe.nutrition.saturatedFatContent,
                unsaturatedFatContent: recipe.nutrition.unsaturatedFatContent,
                transFatContent: recipe.nutrition.transFatContent,
                cholesterolContent: recipe.nutrition.cholesterolContent,
                sodiumContent: recipe.nutrition.sodiumContent,
                fiberContent: recipe.nutrition.fiberContent,
                sugarContent: recipe.nutrition.sugarContent,
                servingSize: recipe.nutrition.servingSize,
            } : undefined,
            aggregateRating: recipe.aggregateRating ? {
                '@type': 'AggregateRating',
                ratingValue: recipe.aggregateRating.ratingValue,
                ratingCount: recipe.aggregateRating.ratingCount,
            } : undefined,
            suitableForDiet: recipe.suitableForDiet?.map(diet => `https://schema.org/${diet}`),
        };

        // Remove undefined fields
        const cleanedData = structuredClone(structuredData);

        // Create and inject script tag
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(cleanedData, null, 2);
        script.id = 'recipe-structured-data';
        document.head.appendChild(script);

        // Cleanup on unmount
        return () => {
            const existingScript = document.getElementById('recipe-structured-data');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, [recipe]);

    return null;
};
