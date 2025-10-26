import {Box, Button, Heading, VStack, HStack, Text, Badge} from '@chakra-ui/react';
import {useNavigate, useLocation} from 'react-router-dom';
import {AiOutlineArrowLeft, AiOutlineSave, AiOutlineCheckCircle} from 'react-icons/ai';
import {useRecipeOperations} from '@/hooks/useRecipeOperations';
import {useRecipeForm} from '@/hooks/useRecipeForm';
import {RecipeFormFields} from '@/components/RecipeFormFields';
import {ROUTES, getRecipeViewRoute} from '@/routing/routes';
import type {IRecipe} from '@/interfaces/IRecipe';

/**
 * Add recipe screen with multi-tab form
 * Supports importing recipe data via location state
 */
const AddRecipe = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {addRecipe, loading, error} = useRecipeOperations();

    // Check if we have imported recipe data
    const importedRecipe = (location.state as {importedRecipe?: Partial<IRecipe>})?.importedRecipe;
    const formState = useRecipeForm(importedRecipe as IRecipe | undefined);

    const handleSave = async () => {
        const recipe = formState.buildRecipeObject();
        const recipeId = await addRecipe(recipe);
        if (recipeId) {
            navigate(getRecipeViewRoute(recipeId));
        }
    };

    return (
        <Box p={8} w="100%" maxW="1000px" mx="auto">
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <HStack justifyContent="space-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(ROUTES.RECIPES)}
                    >
                        <AiOutlineArrowLeft/> Back to Recipes
                    </Button>
                    <VStack gap={1}>
                        <Heading size="2xl">Add New Recipe</Heading>
                        {importedRecipe && (
                            <Badge colorScheme="green" variant="subtle">
                                <AiOutlineCheckCircle /> Imported from website
                            </Badge>
                        )}
                    </VStack>
                    <Box width="120px"/> {/* Spacer for alignment */}
                </HStack>

                {error && (
                    <Text color="red.500" fontSize="sm">
                        {error}
                    </Text>
                )}

                <RecipeFormFields formState={formState} />

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
