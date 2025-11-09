import { Box, Button, Heading, Image, Text, VStack, HStack, Badge, Spinner, Grid } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineArrowLeft } from 'react-icons/ai';
import { useRecipe } from '@/screens/recipe-management/hooks/useRecipe.ts';
import { useRecipeOperations } from '@/screens/recipe-management/hooks/useRecipeOperations.ts';
import { RecipeJsonLd } from '@/screens/recipe-management/components/RecipeJsonLd.tsx';
import { iso8601ToReadable } from '@/utils/durationFormat';
import { ROUTES, getRecipeEditRoute } from '@/routing/routes';

/**
 * View recipe screen showing full recipe details with structured data
 */
const ViewRecipe = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { recipe, loading, error } = useRecipe(id);
    const { deleteRecipe, loading: deleteLoading } = useRecipeOperations();

    const handleDelete = async () => {
        if (!id) return;

        const confirmed = globalThis.confirm('Are you sure you want to delete this recipe?');
        if (!confirmed) return;

        const success = await deleteRecipe(id);
        if (success) {
            navigate(ROUTES.RECIPES);
        }
    };

    const handleEdit = () => {
        if (id) {
            navigate(getRecipeEditRoute(id));
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (error || !recipe) {
        return (
            <Box p={8} textAlign="center">
                <Text color="red.500" fontSize="lg">
                    {error || 'Recipe not found'}
                </Text>
                <Button mt={4} onClick={() => navigate(ROUTES.RECIPES)}>
                    Back to Recipes
                </Button>
            </Box>
        );
    }

    const imageUrl = Array.isArray(recipe.image) ? recipe.image[0] : recipe.image;

    return (
        <>
            <RecipeJsonLd recipe={recipe} />
            <Box p={{base: 4, md: 6, lg: 8}} w="full" maxW="5xl" mx="auto" bg={"colorScheme.background"}>
                <VStack align="stretch" gap={{base: 4, md: 5, lg: 6}}>
                    {/* Header with actions */}
                    <VStack align="stretch" gap={2}>
                        <HStack justifyContent="space-between" flexWrap="wrap" gap={2}>
                            <Button
                                variant="ghost"
                                onClick={() => navigate(ROUTES.RECIPES)}
                                size={{base: "sm", md: "md"}}
                            >
                                <AiOutlineArrowLeft />
                                <Box display={{base: "none", sm: "inline"}}>Back to Recipes</Box>
                                <Box display={{base: "inline", sm: "none"}}>Back</Box>
                            </Button>
                            <HStack gap={2}>
                                <Button
                                    colorScheme="blue"
                                    onClick={handleEdit}
                                    size={{base: "sm", md: "md"}}
                                >
                                    <AiOutlineEdit />
                                    <Box display={{base: "none", sm: "inline"}}>Edit</Box>
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={handleDelete}
                                    loading={deleteLoading}
                                    size={{base: "sm", md: "md"}}
                                >
                                    <AiOutlineDelete />
                                    <Box display={{base: "none", sm: "inline"}}>Delete</Box>
                                </Button>
                            </HStack>
                        </HStack>
                    </VStack>

                    {/* Recipe image */}
                    <Image
                        src={imageUrl}
                        alt={recipe.name}
                        maxHeight={{base: "300px", md: "400px", lg: "500px"}}
                        objectFit="cover"
                        borderRadius="lg"
                    />

                    {/* Recipe title and description */}
                    <VStack align="stretch" gap={3}>
                        <Heading size={{base: "2xl", md: "3xl"}}>{recipe.name}</Heading>
                        {recipe.description && (
                            <Text fontSize={{base: "md", md: "lg"}} color="gray.600">
                                {recipe.description}
                            </Text>
                        )}
                    </VStack>

                    {/* Categories and cuisines */}
                    {(recipe.recipeCategory || recipe.recipeCuisine) && (
                        <HStack gap={2} flexWrap="wrap">
                            {recipe.recipeCategory?.map((category) => (
                                <Badge key={category} colorScheme="blue" size="lg">
                                    {category}
                                </Badge>
                            ))}
                            {recipe.recipeCuisine?.map((cuisine) => (
                                <Badge key={cuisine} colorScheme="green" size="lg">
                                    {cuisine}
                                </Badge>
                            ))}
                        </HStack>
                    )}

                    {/* Time and yield info */}
                    <Grid templateColumns={{base: "repeat(2, 1fr)", md: "repeat(auto-fit, minmax(200px, 1fr))"}} gap={{base: 3, md: 4}}>
                        {recipe.prepTime && (
                            <Box>
                                <Text fontWeight="bold">Prep Time</Text>
                                <Text>{iso8601ToReadable(recipe.prepTime)}</Text>
                            </Box>
                        )}
                        {recipe.cookTime && (
                            <Box>
                                <Text fontWeight="bold">Cook Time</Text>
                                <Text>{iso8601ToReadable(recipe.cookTime)}</Text>
                            </Box>
                        )}
                        {recipe.totalTime && (
                            <Box>
                                <Text fontWeight="bold">Total Time</Text>
                                <Text>{iso8601ToReadable(recipe.totalTime)}</Text>
                            </Box>
                        )}
                        {recipe.recipeYield && (
                            <Box>
                                <Text fontWeight="bold">Yield</Text>
                                <Text>{recipe.recipeYield}</Text>
                            </Box>
                        )}
                    </Grid>

                    {/* Ingredients */}
                    <Box>
                        <Heading size={{base: "lg", md: "xl"}} mb={{base: 3, md: 4}}>Ingredients</Heading>
                        <VStack align="stretch" gap={2}>
                            {recipe.recipeIngredient.map((ingredient, index) => (
                                <Text key={index} fontSize={{base: "md", md: "lg"}}>
                                    • {ingredient}
                                </Text>
                            ))}
                        </VStack>
                    </Box>

                    {/* Instructions */}
                    <Box>
                        <Heading size={{base: "lg", md: "xl"}} mb={{base: 3, md: 4}}>Instructions</Heading>
                        <VStack align="stretch" gap={{base: 3, md: 4}}>
                            {recipe.recipeInstructions.map((instruction, index) => (
                                <Box key={`step${index}`}>
                                    <Text fontWeight="bold" fontSize={{base: "md", md: "lg"}} mb={1}>
                                        Step {index + 1}
                                    </Text>
                                    <Text fontSize={{base: "md", md: "lg"}}>{instruction}</Text>
                                </Box>
                            ))}
                        </VStack>
                    </Box>

                    {/* Nutrition information */}
                    {recipe.nutrition && (
                        <Box>
                            <Heading size={{base: "lg", md: "xl"}} mb={{base: 3, md: 4}}>Nutrition Information</Heading>
                            <Grid templateColumns={{base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(auto-fit, minmax(200px, 1fr))"}} gap={3}>
                                {recipe.nutrition.servingSize && (
                                    <Box>
                                        <Text fontWeight="bold">Serving Size</Text>
                                        <Text>{recipe.nutrition.servingSize}</Text>
                                    </Box>
                                )}
                                {recipe.nutrition.calories && (
                                    <Box>
                                        <Text fontWeight="bold">Calories</Text>
                                        <Text>{recipe.nutrition.calories}</Text>
                                    </Box>
                                )}
                                {recipe.nutrition.proteinContent && (
                                    <Box>
                                        <Text fontWeight="bold">Protein</Text>
                                        <Text>{recipe.nutrition.proteinContent}</Text>
                                    </Box>
                                )}
                                {recipe.nutrition.carbohydrateContent && (
                                    <Box>
                                        <Text fontWeight="bold">Carbohydrates</Text>
                                        <Text>{recipe.nutrition.carbohydrateContent}</Text>
                                    </Box>
                                )}
                                {recipe.nutrition.fatContent && (
                                    <Box>
                                        <Text fontWeight="bold">Total Fat</Text>
                                        <Text>{recipe.nutrition.fatContent}</Text>
                                    </Box>
                                )}
                                {recipe.nutrition.fiberContent && (
                                    <Box>
                                        <Text fontWeight="bold">Fiber</Text>
                                        <Text>{recipe.nutrition.fiberContent}</Text>
                                    </Box>
                                )}
                            </Grid>
                        </Box>
                    )}

                    {/* Keywords */}
                    {recipe.keywords && recipe.keywords.length > 0 && (
                        <Box>
                            <Heading size="lg" mb={3}>Tags</Heading>
                            <HStack gap={2} flexWrap="wrap">
                                {recipe.keywords.map((keyword) => (
                                    <Badge key={keyword} variant="subtle" size="md">
                                        {keyword}
                                    </Badge>
                                ))}
                            </HStack>
                        </Box>
                    )}
                </VStack>
            </Box>
        </>
    );
};

export default ViewRecipe;
