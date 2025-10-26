import {useState, useEffect} from 'react';
import type {IRecipe} from '@/interfaces/IRecipe';
import type {IRecipeNutrition} from '@/interfaces/IRecipeNutrition';
import {timeToISO8601, iso8601ToMinutes} from '@/utils/durationFormat';

export interface RecipeFormState {
    // Basic info
    name: string;
    setName: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    image: string;
    setImage: (value: string) => void;
    imageSource: 'upload' | 'url';
    setImageSource: (value: 'upload' | 'url') => void;
    recipeYield: string;
    setRecipeYield: (value: string) => void;

    // Time
    prepHours: number;
    setPrepHours: (value: number) => void;
    prepMinutes: number;
    setPrepMinutes: (value: number) => void;
    cookHours: number;
    setCookHours: (value: number) => void;
    cookMinutes: number;
    setCookMinutes: (value: number) => void;

    // Ingredients and instructions
    ingredients: string[];
    setIngredients: (value: string[]) => void;
    instructions: string[];
    setInstructions: (value: string[]) => void;

    // Categorization
    categories: string;
    setCategories: (value: string) => void;
    cuisines: string;
    setCuisines: (value: string) => void;
    keywords: string;
    setKeywords: (value: string) => void;

    // Nutrition
    nutrition: IRecipeNutrition | undefined;
    setNutrition: (value: IRecipeNutrition | undefined) => void;

    // Helper
    buildRecipeObject: () => Partial<IRecipe>;
}

/**
 * Custom hook for managing recipe form state and logic
 * Can be initialized with an existing recipe for edit mode
 */
export const useRecipeForm = (initialRecipe?: IRecipe): RecipeFormState => {
    // Basic info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [imageSource, setImageSource] = useState<'upload' | 'url'>('url');
    const [recipeYield, setRecipeYield] = useState('');

    // Time
    const [prepHours, setPrepHours] = useState(0);
    const [prepMinutes, setPrepMinutes] = useState(0);
    const [cookHours, setCookHours] = useState(0);
    const [cookMinutes, setCookMinutes] = useState(0);

    // Ingredients and instructions
    const [ingredients, setIngredients] = useState<string[]>(['']);
    const [instructions, setInstructions] = useState<string[]>(['']);

    // Categorization
    const [categories, setCategories] = useState('');
    const [cuisines, setCuisines] = useState('');
    const [keywords, setKeywords] = useState('');

    // Nutrition
    const [nutrition, setNutrition] = useState<IRecipeNutrition | undefined>(undefined);

    // Populate form when initial recipe is provided (edit mode)
    useEffect(() => {
        if (!initialRecipe) return;

        setName(initialRecipe.name);
        setDescription(initialRecipe.description || '');
        setImage(Array.isArray(initialRecipe.image) ? initialRecipe.image[0] : initialRecipe.image);
        setImageSource(initialRecipe.imageSource || 'url');
        setRecipeYield(initialRecipe.recipeYield || '');

        // Parse time
        if (initialRecipe.prepTime) {
            const totalMinutes = iso8601ToMinutes(initialRecipe.prepTime);
            setPrepHours(Math.floor(totalMinutes / 60));
            setPrepMinutes(totalMinutes % 60);
        }
        if (initialRecipe.cookTime) {
            const totalMinutes = iso8601ToMinutes(initialRecipe.cookTime);
            setCookHours(Math.floor(totalMinutes / 60));
            setCookMinutes(totalMinutes % 60);
        }

        setIngredients(initialRecipe.recipeIngredient.length > 0 ? initialRecipe.recipeIngredient : ['']);
        setInstructions(initialRecipe.recipeInstructions.length > 0 ? initialRecipe.recipeInstructions : ['']);
        setCategories(initialRecipe.recipeCategory?.join(', ') || '');
        setCuisines(initialRecipe.recipeCuisine?.join(', ') || '');
        setKeywords(initialRecipe.keywords?.join(', ') || '');
        setNutrition(initialRecipe.nutrition);
    }, [initialRecipe]);

    // Build recipe object with calculated times
    const buildRecipeObject = (): Partial<IRecipe> => {
        const prepTime = timeToISO8601(prepHours, prepMinutes);
        const cookTime = timeToISO8601(cookHours, cookMinutes);
        const totalMinutes = (prepHours + cookHours) * 60 + prepMinutes + cookMinutes;
        const totalTime = timeToISO8601(Math.floor(totalMinutes / 60), totalMinutes % 60);

        return {
            name,
            description,
            image,
            imageSource,
            recipeYield,
            prepTime: prepTime === 'PT0M' ? undefined : prepTime,
            cookTime: cookTime === 'PT0M' ? undefined : cookTime,
            totalTime: totalTime === 'PT0M' ? undefined : totalTime,
            recipeIngredient: ingredients.filter(i => i.trim() !== ''),
            recipeInstructions: instructions.filter(i => i.trim() !== ''),
            recipeCategory: categories.split(',').map(c => c.trim()).filter(c => c !== ''),
            recipeCuisine: cuisines.split(',').map(c => c.trim()).filter(c => c !== ''),
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k !== ''),
            nutrition: nutrition && Object.values(nutrition).some(v => v) ? nutrition : undefined,
        };
    };

    return {
        name,
        setName,
        description,
        setDescription,
        image,
        setImage,
        imageSource,
        setImageSource,
        recipeYield,
        setRecipeYield,
        prepHours,
        setPrepHours,
        prepMinutes,
        setPrepMinutes,
        cookHours,
        setCookHours,
        cookMinutes,
        setCookMinutes,
        ingredients,
        setIngredients,
        instructions,
        setInstructions,
        categories,
        setCategories,
        cuisines,
        setCuisines,
        keywords,
        setKeywords,
        nutrition,
        setNutrition,
        buildRecipeObject,
    };
};
