import { useState } from 'react';
import {
    Box, Button, Heading, Input, Textarea, VStack, HStack, Text,
    Tabs, TabList, TabPanels, Tab, TabPanel, NumberInput,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import { useRecipeOperations } from '@/hooks/useRecipeOperations';
import { IngredientInput } from '@/components/IngredientInput';
import { InstructionInput } from '@/components/InstructionInput';
import { NutritionInput } from '@/components/NutritionInput';
import { ImageUpload } from '@/components/ImageUpload';
import { IRecipe } from '@/interfaces/IRecipe';
import { IRecipeNutrition } from '@/interfaces/IRecipeNutrition';
import { timeToISO8601 } from '@/utils/durationFormat';
import { ROUTES, getRecipeViewRoute } from '@/routing/routes';

/**
 * Add recipe screen with multi-tab form
 */
const AddRecipe = () => {
    const navigate = useNavigate();
    const { addRecipe, loading, error } = useRecipeOperations();

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

    const handleSave = async () => {
        const prepTime = timeToISO8601(prepHours, prepMinutes);
        const cookTime = timeToISO8601(cookHours, cookMinutes);
        const totalMinutes = (prepHours + cookHours) * 60 + prepMinutes + cookMinutes;
        const totalTime = timeToISO8601(Math.floor(totalMinutes / 60), totalMinutes % 60);

        const recipe: Partial<IRecipe> = {
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

        const recipeId = await addRecipe(recipe);
        if (recipeId) {
            navigate(getRecipeViewRoute(recipeId));
        }
    };

    return (
        <Box p={8} maxW="1000px" mx="auto">
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <HStack justifyContent="space-between">
                    <Button
                        leftIcon={<AiOutlineArrowLeft />}
                        variant="ghost"
                        onClick={() => navigate(ROUTES.RECIPES)}
                    >
                        Back to Recipes
                    </Button>
                    <Heading size="2xl">Add New Recipe</Heading>
                    <Box width="120px" /> {/* Spacer for alignment */}
                </HStack>

                {error && (
                    <Text color="red.500" fontSize="sm">
                        {error}
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
                                        placeholder="e.g., Chocolate Chip Cookies"
                                        size="lg"
                                    />
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Description</Text>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description of the recipe"
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
                                        placeholder="e.g., 6 servings, Makes 12 cookies"
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
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Separate multiple categories with commas
                                    </Text>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Cuisines</Text>
                                    <Input
                                        value={cuisines}
                                        onChange={(e) => setCuisines(e.target.value)}
                                        placeholder="e.g., Italian, Mexican (comma-separated)"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Separate multiple cuisines with commas
                                    </Text>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Keywords/Tags</Text>
                                    <Input
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="e.g., quick, easy, vegetarian (comma-separated)"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Separate multiple keywords with commas
                                    </Text>
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
                        isLoading={loading}
                        size="lg"
                    >
                        Save Recipe
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default AddRecipe;
