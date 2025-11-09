import {useState, useMemo} from 'react';
import {
    Box,
    Button,
    Grid,
    Heading,
    Input,
    Select,
    Spinner,
    Text,
    VStack,
    HStack,
    createListCollection
} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {AiOutlinePlus} from 'react-icons/ai';
import {useRecipes} from '@/screens/recipe-management/hooks/useRecipes.ts';
import {RecipeCard} from '@/screens/recipe-management/components/RecipeCard.tsx';
import {RecipeImportButton} from '@/screens/recipe-management/components/RecipeImport.tsx';
import {ROUTES} from '@/routing/routes';

/**
 * Recipe list screen showing all recipes with filtering and search
 */
const RecipeList = () => {
    const navigate = useNavigate();
    const {recipes, loading, error} = useRecipes();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [cuisineFilter, setCuisineFilter] = useState<string[]>([]);

    // Get unique categories and cuisines for filters
    const categories = useMemo(() => {
        const allCategories = recipes.flatMap(r => r.recipeCategory || []);

        return createListCollection({
            items: [...new Set(allCategories)].sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1)),
            itemToString: (item) => item,
            itemToValue: (item) => item,
        })
    }, [recipes]);

    const cuisines = useMemo(() => {
        const allCuisines = recipes.flatMap(r => r.recipeCuisine || []);

        return createListCollection({
            items: [...new Set(allCuisines)].sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1)),
            itemToString: (item) => item,
            itemToValue: (item) => item,
        })
    }, [recipes]);

    // Filter recipes based on search and filters
    const filteredRecipes = useMemo(() => {
        return recipes.filter(recipe => {
            const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter.length === 0 ||
                categoryFilter.some(cat => recipe.recipeCategory?.includes(cat));

            const matchesCuisine = cuisineFilter.length === 0 ||
                cuisineFilter.some(cuisine => recipe.recipeCuisine?.includes(cuisine));

            return matchesSearch && matchesCategory && matchesCuisine;
        });
    }, [recipes, searchTerm, categoryFilter, cuisineFilter]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Spinner size="xl"/>
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
        <Box p={{base: 4, md: 6, lg: 8}} w="100%" maxW={"5xl"} mx={"auto"}>
            <VStack align="stretch" gap={{base: 4, md: 5, lg: 6}}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems={{base: "flex-start", md: "center"}} flexDirection={{base: "column", md: "row"}} gap={{base: 3, md: 0}}>
                    <Heading size={{base: "xl", md: "2xl"}}>Recipes</Heading>
                    <HStack gap={{base: 2, md: 3}} w={{base: "100%", md: "auto"}}>
                        <RecipeImportButton />
                        <Button
                            colorScheme="blue"
                            onClick={() => navigate(ROUTES.RECIPE_ADD)}
                        >
                            <AiOutlinePlus/> Add Recipe
                        </Button>
                    </HStack>
                </Box>

                {/* Search and Filters */}
                <VStack align="stretch" gap={{base: 2, md: 3}}>
                    <Input
                        placeholder="Search recipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size={{base: "md", md: "lg"}}
                    />
                    <VStack gap={{base: 2, md: 0}} align="stretch" display={{base: "flex", md: "none"}}>
                        {/* Mobile: Vertical stacking */}
                        <Select.Root
                            collection={categories}
                            value={categoryFilter}
                            multiple={false}
                            onValueChange={(e) => setCategoryFilter(e.value)}
                        >
                            <Select.HiddenSelect/>
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="All Categories"/>
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator/>
                                    <Select.ClearTrigger/>
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {categories.items.map(category => (
                                        <Select.Item item={category} key={category}>
                                            {category}
                                            <Select.ItemIndicator/>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>
                        <Select.Root
                            collection={cuisines}
                            value={cuisineFilter}
                            multiple={false}
                            onValueChange={(e) => setCuisineFilter(e.value)}
                        >
                            <Select.HiddenSelect/>
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="All Cuisines"/>
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator/>
                                    <Select.ClearTrigger/>
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {cuisines.items.map(cuisine => (
                                        <Select.Item item={cuisine} key={cuisine}>
                                            {cuisine}
                                            <Select.ItemIndicator/>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>
                    </VStack>
                    <HStack gap={3} display={{base: "none", md: "flex"}}>
                        {/* Desktop: Horizontal layout */}
                        <Select.Root
                            collection={categories}
                            value={categoryFilter}
                            multiple={false}
                            onValueChange={(e) => setCategoryFilter(e.value)}
                        >
                            <Select.HiddenSelect/>
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="All Categories"/>
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator/>
                                    <Select.ClearTrigger/>
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {categories.items.map(category => (
                                        <Select.Item item={category} key={category}>
                                            {category}
                                            <Select.ItemIndicator/>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>
                        <Select.Root
                            collection={cuisines}
                            value={cuisineFilter}
                            multiple={false}
                            onValueChange={(e) => setCuisineFilter(e.value)}
                        >
                            <Select.HiddenSelect/>
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="All Cuisines"/>
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator/>
                                    <Select.ClearTrigger/>
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {cuisines.items.map(cuisine => (
                                        <Select.Item item={cuisine} key={cuisine}>
                                            {cuisine}
                                            <Select.ItemIndicator/>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>
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
                                <RecipeCard key={recipe.id} recipe={recipe}/>
                            ))}
                        </Grid>
                    </>
                )}
            </VStack>
        </Box>
    );
};

export default RecipeList;
