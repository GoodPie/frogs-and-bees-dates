import {useState} from 'react';
import {Box, Input, Textarea, VStack, Text, Tabs, HStack, Button, DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, DialogTitle} from '@chakra-ui/react';
import {InstructionInput} from '@/screens/recipe-management/components/InstructionInput.tsx';
import {ImageUpload} from '@/screens/recipe-management/components/ImageUpload.tsx';
import {TimeInputGroup} from '@/components/TimeInputGroup.tsx';
import type {RecipeFormState} from '@/screens/recipe-management/hooks/useRecipeForm.ts';
import {IngredientList, type DisplayMode} from '@/screens/recipe-management/components/IngredientList.tsx';
import {IngredientForm} from '@/screens/recipe-management/components/IngredientForm.tsx';
import type {ParsedIngredient} from '@/models/ParsedIngredient.ts';

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
        parsedIngredients,
        setParsedIngredients,
        instructions,
        setInstructions,
        categories,
        setCategories,
        cuisines,
        setCuisines,
        keywords,
        setKeywords,
    } = formState;

    // Local state for ingredient editing
    const [displayMode, setDisplayMode] = useState<DisplayMode>('metric');
    const [editingIngredient, setEditingIngredient] = useState<ParsedIngredient | null>(null);
    const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(null);

    const handleIngredientEdit = (_index: number, ingredient: ParsedIngredient) => {
        setEditingIngredient(ingredient);
        setIsCreatingIngredient(false);
    };

    const handleIngredientAdd = () => {
        setIsCreatingIngredient(true);
        setEditingIngredient(null);
    };

    const handleIngredientSave = (updated: ParsedIngredient) => {
        if (isCreatingIngredient) {
            // Adding a new ingredient
            const newParsed = [...parsedIngredients, updated];
            setParsedIngredients(newParsed);

            // Sync with raw ingredients
            const newRaw = [...ingredients, updated.originalText];
            setIngredients(newRaw);

            setIsCreatingIngredient(false);
        } else {
            // Editing an existing ingredient
            const index = parsedIngredients.findIndex(
                (ing) => ing.originalText === editingIngredient?.originalText
            );
            if (index !== -1) {
                // Mark as manually edited if this is a user edit
                const manuallyEdited: ParsedIngredient = {
                    ...updated,
                    parsingMethod: 'manual',
                    confidence: 1.0, // User-edited ingredients are fully "confident"
                    requiresManualReview: false, // User has reviewed it
                };

                const newParsed = [...parsedIngredients];
                newParsed[index] = manuallyEdited;
                setParsedIngredients(newParsed);

                // Sync with raw ingredients
                const newRaw = [...ingredients];
                newRaw[index] = manuallyEdited.originalText;
                setIngredients(newRaw);
            }
            setEditingIngredient(null);
        }
    };

    const handleIngredientCancel = () => {
        setEditingIngredient(null);
        setIsCreatingIngredient(false);
    };

    const handleIngredientDelete = (index: number) => {
        setIngredientToDelete(index);
    };

    const confirmDelete = () => {
        if (ingredientToDelete !== null) {
            const newParsed = parsedIngredients.filter((_, i) => i !== ingredientToDelete);
            setParsedIngredients(newParsed);

            const newRaw = ingredients.filter((_, i) => i !== ingredientToDelete);
            setIngredients(newRaw);

            setIngredientToDelete(null);
        }
    };

    const cancelDelete = () => {
        setIngredientToDelete(null);
    };

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
                    <HStack justify="space-between">
                        <Text fontWeight="bold">Ingredients *</Text>
                        {parsedIngredients.length > 0 && !editingIngredient && !isCreatingIngredient && (
                            <HStack gap={2}>
                                <Button
                                    size="sm"
                                    variant={displayMode === 'original' ? 'solid' : 'outline'}
                                    onClick={() => setDisplayMode('original')}
                                >
                                    Original
                                </Button>
                                <Button
                                    size="sm"
                                    variant={displayMode === 'metric' ? 'solid' : 'outline'}
                                    onClick={() => setDisplayMode('metric')}
                                >
                                    Metric
                                </Button>
                                <Button
                                    size="sm"
                                    variant={displayMode === 'imperial' ? 'solid' : 'outline'}
                                    onClick={() => setDisplayMode('imperial')}
                                >
                                    Imperial
                                </Button>
                            </HStack>
                        )}
                    </HStack>

                    {/* Show ingredient form if editing or creating */}
                    {(editingIngredient || isCreatingIngredient) ? (
                        <Box p={4} borderWidth="1px" borderRadius="md">
                            <IngredientForm
                                ingredient={editingIngredient || undefined}
                                onSave={handleIngredientSave}
                                onCancel={handleIngredientCancel}
                                mode={isCreatingIngredient ? 'create' : 'edit'}
                            />
                        </Box>
                    ) : (
                        <>
                            <IngredientList
                                ingredients={parsedIngredients}
                                displayMode={displayMode}
                                onEditIngredient={handleIngredientEdit}
                                onAddIngredient={handleIngredientAdd}
                                onDeleteIngredient={handleIngredientDelete}
                            />
                            <DialogRoot
                                open={ingredientToDelete !== null}
                                onOpenChange={(e) => {
                                    if (!e.open) cancelDelete();
                                }}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Ingredient</DialogTitle>
                                    </DialogHeader>
                                    <DialogBody>
                                        <Text>
                                            Are you sure you want to delete this ingredient? This action cannot be undone.
                                        </Text>
                                    </DialogBody>
                                    <DialogFooter>
                                        <DialogActionTrigger asChild>
                                            <Button variant="outline" onClick={cancelDelete}>
                                                Cancel
                                            </Button>
                                        </DialogActionTrigger>
                                        <Button colorScheme="red" onClick={confirmDelete}>
                                            Delete
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </DialogRoot>
                        </>
                    )}
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
