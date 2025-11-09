import {Box, Button, Heading, VStack, HStack, Text, Badge} from '@chakra-ui/react';
import {useNavigate, useLocation} from 'react-router-dom';
import {AiOutlineArrowLeft, AiOutlineSave, AiOutlineCheckCircle} from 'react-icons/ai';
import {useRecipeOperations} from '@/hooks/useRecipeOperations';
import {useRecipeForm} from '@/hooks/useRecipeForm';
import {RecipeFormFields} from '@/components/RecipeFormFields';
import {ROUTES, getRecipeViewRoute} from '@/routing/routes';
import type {IRecipe} from "@/types/recipe/Recipe.ts";

/**
 * Add recipe screen with multi-tab form
 * Supports importing recipe data via location state
 */
const AddRecipe = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {addRecipe, loading, error} = useRecipeOperations();

    // Check if we have imported recipe data
    const importedRecipe = (location.state as { importedRecipe?: Partial<IRecipe> })?.importedRecipe;
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
