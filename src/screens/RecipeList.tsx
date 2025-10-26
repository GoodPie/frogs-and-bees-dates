import { useState, useMemo } from 'react';
import { Box, Button, Grid, Heading, Input, Select, Spinner, Text, VStack, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { ROUTES } from '@/routing/routes';

/**
 * Recipe list screen showing all recipes with filtering and search
 */
const RecipeList = () => {
    const navigate = useNavigate();
    const { recipes, loading, error } = useRecipes();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [cuisineFilter, setCuisineFilter] = useState('');

    // Get unique categories and cuisines for filters
    const categories = useMemo(() => {
        const allCategories = recipes.flatMap(r => r.recipeCategory || []);
        return [...new Set(allCategories)].sort();
    }, [recipes]);

    const cuisines = useMemo(() => {
        const allCuisines = recipes.flatMap(r => r.recipeCuisine || []);
        return [...new Set(allCuisines)].sort();
    }, [recipes]);

    // Filter recipes based on search and filters
    const filteredRecipes = useMemo(() => {
        return recipes.filter(recipe => {
            const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = !categoryFilter ||
                recipe.recipeCategory?.includes(categoryFilter);

            const matchesCuisine = !cuisineFilter ||
                recipe.recipeCuisine?.includes(cuisineFilter);

            return matchesSearch && matchesCategory && matchesCuisine;
        });
    }, [recipes, searchTerm, categoryFilter, cuisineFilter]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={8} textAlign="center">
                <Text color="red.500" fontSize="lg">
                    {error}
                </Text>
            </Box>
        );
    }

    return (
        <Box p={8}>
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Heading size="2xl">Recipes</Heading>
                    <Button
                        leftIcon={<AiOutlinePlus />}
                        colorScheme="blue"
                        onClick={() => navigate(ROUTES.RECIPE_ADD)}
                    >
                        Add Recipe
                    </Button>
                </Box>

                {/* Search and Filters */}
                <VStack align="stretch" gap={3}>
                    <Input
                        placeholder="Search recipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="lg"
                    />
                    <HStack gap={3}>
                        <Select
                            placeholder="All Categories"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </Select>
                        <Select
                            placeholder="All Cuisines"
                            value={cuisineFilter}
                            onChange={(e) => setCuisineFilter(e.target.value)}
                        >
                            {cuisines.map(cuisine => (
                                <option key={cuisine} value={cuisine}>
                                    {cuisine}
                                </option>
                            ))}
                        </Select>
                    </HStack>
                </VStack>

                {/* Recipe Grid */}
                {filteredRecipes.length === 0 ? (
                    <Box textAlign="center" py={12}>
                        <Text fontSize="lg" color="gray.500">
                            {searchTerm || categoryFilter || cuisineFilter
                                ? 'No recipes match your filters'
                                : 'No recipes yet. Add your first recipe!'}
                        </Text>
                    </Box>
                ) : (
                    <>
                        <Text color="gray.600">
                            Showing {filteredRecipes.length} of {recipes.length} recipes
                        </Text>
                        <Grid
                            templateColumns={{
                                base: '1fr',
                                md: 'repeat(2, 1fr)',
                                lg: 'repeat(3, 1fr)',
                            }}
                            gap={6}
                        >
                            {filteredRecipes.map(recipe => (
                                <RecipeCard key={recipe.id} recipe={recipe} />
                            ))}
                        </Grid>
                    </>
                )}
            </VStack>
        </Box>
    );
};

export default RecipeList;
