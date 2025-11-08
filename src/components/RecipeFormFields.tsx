import {Box, Input, Textarea, VStack, Text, Tabs} from '@chakra-ui/react';
import {IngredientInput} from '@/components/IngredientInput';
import {InstructionInput} from '@/components/InstructionInput';
import {ImageUpload} from '@/components/ImageUpload';
import {TimeInputGroup} from '@/components/TimeInputGroup';
import type {RecipeFormState} from '@/hooks/useRecipeForm';

interface RecipeFormFieldsProps {
    formState: RecipeFormState;
}

/**
 * Shared recipe form fields component used by both AddRecipe and EditRecipe
 */
export const RecipeFormFields = ({formState}: RecipeFormFieldsProps) => {
    const {
        name,
        setName,
        description,
        setDescription,
        image,
        setImage,
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
    } = formState;

    return (
        <Tabs.Root defaultValue="basic" fitted w={"full"} mx={"auto"} variant="enclosed">
            <Tabs.List>
                <Tabs.Trigger value="basic" fontSize={{base: "sm", md: "md"}} px={{base: 2, md: 4}}>
                    <Box display={{base: "none", sm: "inline"}}>Basic Info</Box>
                    <Box display={{base: "inline", sm: "none"}}>Basic</Box>
                </Tabs.Trigger>
                <Tabs.Trigger value="ingredients" fontSize={{base: "sm", md: "md"}}
                              px={{base: 2, md: 4}}>Ingredients</Tabs.Trigger>
                <Tabs.Trigger value="instructions" fontSize={{base: "sm", md: "md"}} px={{base: 2, md: 4}}>
                    <Box display={{base: "none", sm: "inline"}}>Instructions</Box>
                    <Box display={{base: "inline", sm: "none"}}>Steps</Box>
                </Tabs.Trigger>
                <Tabs.Trigger value="categorization" fontSize={{base: "sm", md: "md"}} px={{base: 2, md: 4}}>
                    <Box display={{base: "none", sm: "inline"}}>Categories</Box>
                    <Box display={{base: "inline", sm: "none"}}>Tags</Box>
                </Tabs.Trigger>
            </Tabs.List>

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

                    <TimeInputGroup
                        label="Prep Time"
                        hours={prepHours}
                        minutes={prepMinutes}
                        onHoursChange={setPrepHours}
                        onMinutesChange={setPrepMinutes}
                    />

                    <TimeInputGroup
                        label="Cook Time"
                        hours={cookHours}
                        minutes={cookMinutes}
                        onHoursChange={setCookHours}
                        onMinutesChange={setCookMinutes}
                    />

                    <Box>
                        <Text fontWeight="bold" mb={2}>Recipe Yield</Text>
                        <Input
                            value={recipeYield}
                            onChange={(e) => setRecipeYield(e.target.value)}
                            placeholder="e.g., 6 servings, Makes 12 cookies"
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
        </Tabs.Root>
    );
};
