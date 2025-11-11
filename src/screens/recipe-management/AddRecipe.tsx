import {Badge, Box, Button, Heading, HStack, Text, VStack} from '@chakra-ui/react';
import {useLocation, useNavigate} from 'react-router-dom';
import {AiOutlineArrowLeft, AiOutlineCheckCircle, AiOutlineSave, AiOutlineWarning} from 'react-icons/ai';
import {useRecipeOperations} from '@/screens/recipe-management/hooks/useRecipeOperations.ts';
import {useRecipeForm} from '@/screens/recipe-management/hooks/useRecipeForm.ts';
import {RecipeFormFields} from '@/screens/recipe-management/components/RecipeFormFields.tsx';
import {getRecipeViewRoute, ROUTES} from '@/routing/routes';
import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";
import {useEffect, useState} from 'react';

/**
 * Validates imported recipe data from navigation state
 * Returns validated recipe or null if invalid
 */
function validateImportedRecipe(importedRecipe: unknown): Partial<IRecipe> | null {
    // Check if importedRecipe exists and is an object
    if (!importedRecipe || typeof importedRecipe !== 'object') {
        return null;
    }

    // Type-narrow to a record for safe property access
    const recipe = importedRecipe as Record<string, unknown>;

    // Must have at minimum a name to be considered valid
    if (!recipe.name || typeof recipe.name !== 'string') {
        return null;
    }

    // Validate arrays are actually arrays (not corrupted)
    return {
        ...recipe,
        recipeIngredient: Array.isArray(recipe.recipeIngredient)
            ? recipe.recipeIngredient
            : [],
        recipeInstructions: Array.isArray(recipe.recipeInstructions)
            ? recipe.recipeInstructions
            : [],
        recipeCategory: Array.isArray(recipe.recipeCategory)
            ? recipe.recipeCategory
            : undefined,
        recipeCuisine: Array.isArray(recipe.recipeCuisine)
            ? recipe.recipeCuisine
            : undefined,
        keywords: Array.isArray(recipe.keywords)
            ? recipe.keywords
            : undefined,
        parsedIngredients: Array.isArray(recipe.parsedIngredients)
            ? recipe.parsedIngredients
            : undefined,
    } as Partial<IRecipe>;
}

/**
 * Add recipe screen with multi-tab form
 * Supports importing recipe data via location state with validation and fallback handling
 */
const AddRecipe = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {addRecipe, loading, error} = useRecipeOperations();
    const [validationWarning, setValidationWarning] = useState<string | null>(null);

    // Validate and extract imported recipe data from navigation state
    const rawImportedRecipe = (location.state as { importedRecipe?: Partial<IRecipe> })?.importedRecipe;
    const importedRecipe = rawImportedRecipe ? validateImportedRecipe(rawImportedRecipe) : null;

    // Check if this is a legacy recipe (missing parsedIngredients)
    const isLegacyRecipe = importedRecipe &&
        !importedRecipe.parsedIngredients &&
        importedRecipe.recipeIngredient &&
        importedRecipe.recipeIngredient.length > 0;

    // Show warning for validation issues or legacy recipes
    useEffect(() => {
        if (rawImportedRecipe && !importedRecipe) {
            setValidationWarning('Imported recipe data was incomplete or corrupt. Starting with empty form.');
        } else if (isLegacyRecipe) {
            setValidationWarning('This recipe was imported before ingredient parsing was available. Ingredients will be shown as plain text.');
        }
    }, [rawImportedRecipe, importedRecipe, isLegacyRecipe]);

    const formState = useRecipeForm(importedRecipe as IRecipe | undefined);

    const handleSave = async () => {
        const recipe = formState.buildRecipeObject();
        const recipeId = await addRecipe(recipe);
        if (recipeId) {
            navigate(getRecipeViewRoute(recipeId));
        }
    };

    return (
        <Box p={{base: 4, md: 6, lg: 8}} w="full" maxW="5xl" mx="auto">
            <VStack align="stretch" gap={{base: 4, md: 5, lg: 6}}>
                {/* Header */}
                <VStack align="stretch" gap={2}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(ROUTES.RECIPES)}
                            size={{base: "sm", md: "md"}}
                        >
                            <AiOutlineArrowLeft/>
                            <Box display={{base: "none", sm: "inline"}}>Back to Recipes</Box>
                            <Box display={{base: "inline", sm: "none"}}>Back</Box>
                        </Button>
                    </HStack>
                    <VStack gap={1} align="stretch">
                        <Heading size={{base: "xl", md: "2xl"}}>Add New Recipe</Heading>
                        {importedRecipe && (
                            <Badge colorScheme="green" variant="subtle" w="fit-content">
                                <AiOutlineCheckCircle/> Imported from website
                            </Badge>
                        )}
                    </VStack>
                </VStack>

                {error && (
                    <Text color="red.500" fontSize="sm">
                        {error}
                    </Text>
                )}

                {validationWarning && (
                    <HStack
                        p={3}
                        bg="orange.50"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="orange.200"
                        _dark={{
                            bg: "orange.900",
                            borderColor: "orange.700",
                        }}
                    >
                        <AiOutlineWarning color="orange" />
                        <Text color="orange.700" _dark={{ color: "orange.200" }} fontSize="sm">
                            {validationWarning}
                        </Text>
                    </HStack>
                )}

                <RecipeFormFields formState={formState}/>

                {/* Save button */}
                <HStack justifyContent="flex-end" pt={4}>
                    <Button
                        colorScheme="blue"
                        onClick={handleSave}
                        loading={loading}
                        size="lg"
                    >
                        <AiOutlineSave/> Save Recipe
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default AddRecipe;
