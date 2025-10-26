import {Box, Button, Heading, VStack, HStack, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {AiOutlineArrowLeft, AiOutlineSave} from 'react-icons/ai';
import {useRecipeOperations} from '@/hooks/useRecipeOperations';
import {useRecipeForm} from '@/hooks/useRecipeForm';
import {RecipeFormFields} from '@/components/RecipeFormFields';
import {ROUTES, getRecipeViewRoute} from '@/routing/routes';

/**
 * Add recipe screen with multi-tab form
 */
const AddRecipe = () => {
    const navigate = useNavigate();
    const {addRecipe, loading, error} = useRecipeOperations();
    const formState = useRecipeForm();

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
                    <Heading size="2xl">Add New Recipe</Heading>
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
