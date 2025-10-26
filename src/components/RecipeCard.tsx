import { Card, Image, Text, Badge, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { IRecipe } from '@/interfaces/IRecipe';
import { getRecipeViewRoute } from '@/routing/routes';
import { iso8601ToReadable } from '@/utils/durationFormat';

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
        >
            <Image
                src={imageUrl}
                alt={recipe.name}
                height="200px"
                objectFit="cover"
                borderTopRadius="md"
            />
            <Card.Body gap={2}>
                <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
                    {recipe.name}
                </Text>

                {recipe.description && (
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
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
                        {recipe.recipeCategory?.slice(0, 2).map((category, index) => (
                            <Badge key={index} colorScheme="blue" size="sm">
                                {category}
                            </Badge>
                        ))}
                        {recipe.recipeCuisine?.slice(0, 2).map((cuisine, index) => (
                            <Badge key={index} colorScheme="green" size="sm">
                                {cuisine}
                            </Badge>
                        ))}
                    </HStack>
                )}
            </Card.Body>
        </Card.Root>
    );
};
