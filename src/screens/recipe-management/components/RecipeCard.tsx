import { Card, Image, Text, Badge, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";
import { getRecipeViewRoute } from '@/routing/routes.ts';
import { iso8601ToReadable } from '@/utils/durationFormat.ts';

interface RecipeCardProps {
    recipe: IRecipe;
}

/**
 * Recipe card component for displaying recipe previews in list view
 */
export const RecipeCard = ({ recipe }: RecipeCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (recipe.id) {
            navigate(getRecipeViewRoute(recipe.id));
        }
    };

    const imageUrl = Array.isArray(recipe.image) ? recipe.image[0] : recipe.image;

    return (
        <Card.Root
            onClick={handleClick}
            cursor="pointer"
            _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
            minH="44px"
        >
            <Image
                src={imageUrl}
                alt={recipe.name}
                height={{base: "180px", md: "200px"}}
                objectFit="cover"
                borderTopRadius="md"
            />
            <Card.Body gap={{base: 2, md: 3}}>
                <Text fontWeight="bold" fontSize="lg" maxLines={2}>
                    {recipe.name}
                </Text>

                {recipe.description && (
                    <Text fontSize="sm" color="gray.600" maxLines={2}>
                        {recipe.description}
                    </Text>
                )}

                {recipe.totalTime && (
                    <Text fontSize="sm" color="gray.500">
                        Total time: {iso8601ToReadable(recipe.totalTime)}
                    </Text>
                )}

                {(recipe.recipeCategory || recipe.recipeCuisine) && (
                    <HStack gap={2} flexWrap="wrap" mt={2}>
                        {recipe.recipeCategory?.slice(0, 2).map((category) => (
                            <Badge key={category} colorScheme="blue" size="sm">
                                {category}
                            </Badge>
                        ))}
                        {recipe.recipeCuisine?.slice(0, 2).map((cuisine) => (
                            <Badge key={cuisine} colorScheme="green" size="sm">
                                {cuisine}
                            </Badge>
                        ))}
                    </HStack>
                )}
            </Card.Body>
        </Card.Root>
    );
};
