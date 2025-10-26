import { useState, useEffect } from 'react';
import {
    Box, Button, Heading, Input, Textarea, VStack, HStack, Text, Spinner,
    Tabs, TabList, TabPanels, Tab, TabPanel, NumberInput,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import { useRecipe } from '@/hooks/useRecipe';
import { useRecipeOperations } from '@/hooks/useRecipeOperations';
import { IngredientInput } from '@/components/IngredientInput';
import { InstructionInput } from '@/components/InstructionInput';
import { NutritionInput } from '@/components/NutritionInput';
import { ImageUpload } from '@/components/ImageUpload';
import { IRecipe } from '@/interfaces/IRecipe';
import { IRecipeNutrition } from '@/interfaces/IRecipeNutrition';
import { timeToISO8601, iso8601ToMinutes } from '@/utils/durationFormat';
import { getRecipeViewRoute } from '@/routing/routes';

/**
 * Edit recipe screen with pre-populated form
 */
const EditRecipe = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { recipe, loading: loadingRecipe, error: loadError } = useRecipe(id);
    const { updateRecipe, loading: updating, error: updateError } = useRecipeOperations();

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

    // Populate form when recipe loads
    useEffect(() => {
        if (!recipe) return;

        setName(recipe.name);
        setDescription(recipe.description || '');
        setImage(Array.isArray(recipe.image) ? recipe.image[0] : recipe.image);
        setImageSource(recipe.imageSource || 'url');
        setRecipeYield(recipe.recipeYield || '');

        // Parse time
        if (recipe.prepTime) {
            const totalMinutes = iso8601ToMinutes(recipe.prepTime);
            setPrepHours(Math.floor(totalMinutes / 60));
            setPrepMinutes(totalMinutes % 60);
        }
        if (recipe.cookTime) {
            const totalMinutes = iso8601ToMinutes(recipe.cookTime);
            setCookHours(Math.floor(totalMinutes / 60));
            setCookMinutes(totalMinutes % 60);
        }

        setIngredients(recipe.recipeIngredient.length > 0 ? recipe.recipeIngredient : ['']);
        setInstructions(recipe.recipeInstructions.length > 0 ? recipe.recipeInstructions : ['']);
        setCategories(recipe.recipeCategory?.join(', ') || '');
        setCuisines(recipe.recipeCuisine?.join(', ') || '');
        setKeywords(recipe.keywords?.join(', ') || '');
        setNutrition(recipe.nutrition);
    }, [recipe]);

    const handleSave = async () => {
        if (!id) return;

        const prepTime = timeToISO8601(prepHours, prepMinutes);
        const cookTime = timeToISO8601(cookHours, cookMinutes);
        const totalMinutes = (prepHours + cookHours) * 60 + prepMinutes + cookMinutes;
        const totalTime = timeToISO8601(Math.floor(totalMinutes / 60), totalMinutes % 60);

        const updatedRecipe: Partial<IRecipe> = {
            name,
            description,
            image,
            imageSource,
            recipeYield,
            prepTime: prepTime !== 'PT0M' ? prepTime : undefined,
            cookTime: cookTime !== 'PT0M' ? cookTime : undefined,
            totalTime: totalTime !== 'PT0M' ? totalTime : undefined,
            recipeIngredient: ingredients.filter(i => i.trim() !== ''),
            recipeInstructions: instructions.filter(i => i.trim() !== ''),
            recipeCategory: categories.split(',').map(c => c.trim()).filter(c => c !== ''),
            recipeCuisine: cuisines.split(',').map(c => c.trim()).filter(c => c !== ''),
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k !== ''),
            nutrition: nutrition && Object.values(nutrition).some(v => v) ? nutrition : undefined,
        };

        const success = await updateRecipe(id, updatedRecipe);
        if (success) {
            navigate(getRecipeViewRoute(id));
        }
    };

    if (loadingRecipe) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Spinner size="xl" />
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
        <Box p={8} maxW="1000px" mx="auto">
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <HStack justifyContent="space-between">
                    <Button
                        leftIcon={<AiOutlineArrowLeft />}
                        variant="ghost"
                        onClick={() => id && navigate(getRecipeViewRoute(id))}
                    >
                        Back to Recipe
                    </Button>
                    <Heading size="2xl">Edit Recipe</Heading>
                    <Box width="120px" /> {/* Spacer for alignment */}
                </HStack>

                {updateError && (
                    <Text color="red.500" fontSize="sm">
                        {updateError}
                    </Text>
                )}

                <Tabs.Root defaultValue="basic">
                    <TabList>
                        <Tabs.Trigger value="basic">Basic Info</Tabs.Trigger>
                        <Tabs.Trigger value="ingredients">Ingredients</Tabs.Trigger>
                        <Tabs.Trigger value="instructions">Instructions</Tabs.Trigger>
                        <Tabs.Trigger value="time">Time & Yield</Tabs.Trigger>
                        <Tabs.Trigger value="categorization">Categories</Tabs.Trigger>
                        <Tabs.Trigger value="nutrition">Nutrition</Tabs.Trigger>
                    </TabList>

                    <TabPanels>
                        {/* Basic Info */}
                        <Tabs.Content value="basic">
                            <VStack align="stretch" gap={4} py={4}>
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Recipe Name *</Text>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        size="lg"
                                    />
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Description</Text>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                    />
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Recipe Image *</Text>
                                    <ImageUpload
                                        imageUrl={image}
                                        onImageChange={(url, source) => {
                                            setImage(url);
                                            setImageSource(source);
                                        }}
                                    />
                                </Box>
                            </VStack>
                        </Tabs.Content>

                        {/* Ingredients */}
                        <Tabs.Content value="ingredients">
                            <VStack align="stretch" gap={4} py={4}>
                                <Text fontWeight="bold">Ingredients *</Text>
                                <IngredientInput
                                    ingredients={ingredients}
                                    onChange={setIngredients}
                                />
                            </VStack>
                        </Tabs.Content>

                        {/* Instructions */}
                        <Tabs.Content value="instructions">
                            <VStack align="stretch" gap={4} py={4}>
                                <Text fontWeight="bold">Instructions *</Text>
                                <InstructionInput
                                    instructions={instructions}
                                    onChange={setInstructions}
                                />
                            </VStack>
                        </Tabs.Content>

                        {/* Time & Yield */}
                        <Tabs.Content value="time">
                            <VStack align="stretch" gap={4} py={4}>
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Prep Time</Text>
                                    <HStack>
                                        <Box>
                                            <Text fontSize="sm" mb={1}>Hours</Text>
                                            <NumberInput
                                                value={prepHours.toString()}
                                                onValueChange={(details) => setPrepHours(Number(details.value))}
                                                min={0}
                                            >
                                                <Input />
                                            </NumberInput>
                                        </Box>
                                        <Box>
                                            <Text fontSize="sm" mb={1}>Minutes</Text>
                                            <NumberInput
                                                value={prepMinutes.toString()}
                                                onValueChange={(details) => setPrepMinutes(Number(details.value))}
                                                min={0}
                                                max={59}
                                            >
                                                <Input />
                                            </NumberInput>
                                        </Box>
                                    </HStack>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Cook Time</Text>
                                    <HStack>
                                        <Box>
                                            <Text fontSize="sm" mb={1}>Hours</Text>
                                            <NumberInput
                                                value={cookHours.toString()}
                                                onValueChange={(details) => setCookHours(Number(details.value))}
                                                min={0}
                                            >
                                                <Input />
                                            </NumberInput>
                                        </Box>
                                        <Box>
                                            <Text fontSize="sm" mb={1}>Minutes</Text>
                                            <NumberInput
                                                value={cookMinutes.toString()}
                                                onValueChange={(details) => setCookMinutes(Number(details.value))}
                                                min={0}
                                                max={59}
                                            >
                                                <Input />
                                            </NumberInput>
                                        </Box>
                                    </HStack>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Recipe Yield</Text>
                                    <Input
                                        value={recipeYield}
                                        onChange={(e) => setRecipeYield(e.target.value)}
                                    />
                                </Box>
                            </VStack>
                        </Tabs.Content>

                        {/* Categorization */}
                        <Tabs.Content value="categorization">
                            <VStack align="stretch" gap={4} py={4}>
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Categories</Text>
                                    <Input
                                        value={categories}
                                        onChange={(e) => setCategories(e.target.value)}
                                        placeholder="e.g., Dessert, Appetizer (comma-separated)"
                                    />
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Cuisines</Text>
                                    <Input
                                        value={cuisines}
                                        onChange={(e) => setCuisines(e.target.value)}
                                        placeholder="e.g., Italian, Mexican (comma-separated)"
                                    />
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Keywords/Tags</Text>
                                    <Input
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="e.g., quick, easy, vegetarian (comma-separated)"
                                    />
                                </Box>
                            </VStack>
                        </Tabs.Content>

                        {/* Nutrition */}
                        <Tabs.Content value="nutrition">
                            <VStack align="stretch" gap={4} py={4}>
                                <Text fontWeight="bold">Nutrition Information (Optional)</Text>
                                <NutritionInput
                                    nutrition={nutrition}
                                    onChange={setNutrition}
                                />
                            </VStack>
                        </Tabs.Content>
                    </TabPanels>
                </Tabs.Root>

                {/* Save button */}
                <HStack justifyContent="flex-end" pt={4}>
                    <Button
                        leftIcon={<AiOutlineSave />}
                        colorScheme="blue"
                        onClick={handleSave}
                        isLoading={updating}
                        size="lg"
                    >
                        Save Changes
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default EditRecipe;
