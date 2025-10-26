import {Box, Button, Heading, VStack, HStack, Text, Spinner} from '@chakra-ui/react';
import {useParams, useNavigate} from 'react-router-dom';
import {AiOutlineArrowLeft, AiOutlineSave} from 'react-icons/ai';
import {useRecipe} from '@/hooks/useRecipe';
import {useRecipeOperations} from '@/hooks/useRecipeOperations';
import {useRecipeForm} from '@/hooks/useRecipeForm';
import {RecipeFormFields} from '@/components/RecipeFormFields';
import {getRecipeViewRoute} from '@/routing/routes';

/**
 * Edit recipe screen with pre-populated form
 */
const EditRecipe = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {recipe, loading: loadingRecipe, error: loadError} = useRecipe(id);
    const {updateRecipe, loading: updating, error: updateError} = useRecipeOperations();
    const formState = useRecipeForm(recipe);

    const handleSave = async () => {
        if (!id) return;

        const updatedRecipe = formState.buildRecipeObject();
        const success = await updateRecipe(id, updatedRecipe);
        if (success) {
            navigate(getRecipeViewRoute(id));
        }
    };

    if (loadingRecipe) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Spinner size="xl"/>
            </Box>
        );
    }

    if (loadError || !recipe) {
        return (
            <Box p={8} textAlign="center">
                <Text color="red.500" fontSize="lg">
                    {loadError || 'Recipe not found'}
                </Text>
            </Box>
        );
    }

    return (
        <Box p={8} w="100%" maxW="1000px" mx="auto">
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <HStack justifyContent="space-between">
                    <Button
                        variant="ghost"
                        onClick={() => id && navigate(getRecipeViewRoute(id))}
                    >
                        <AiOutlineArrowLeft/> Back to Recipe
                    </Button>
                    <Heading size="2xl">Edit Recipe</Heading>
                    <Box width="120px"/> {/* Spacer for alignment */}
                </HStack>

                {updateError && (
                    <Text color="red.500" fontSize="sm">
                        {updateError}
                    </Text>
                )}

                <RecipeFormFields formState={formState} />

                {/* Save button */}
                <HStack justifyContent="flex-end" pt={4}>
                    <Button
                        colorScheme="blue"
                        onClick={handleSave}
                        loading={updating}
                        size="lg"
                    >
                        <AiOutlineSave/> Save Changes
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default EditRecipe;
