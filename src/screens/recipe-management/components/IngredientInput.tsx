import { Box, Button, IconButton, Input, VStack } from '@chakra-ui/react';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';

interface IngredientInputProps {
    ingredients: string[];
    onChange: (ingredients: string[]) => void;
}

/**
 * Component for managing a dynamic list of recipe ingredients
 */
export const IngredientInput = ({ ingredients, onChange }: IngredientInputProps) => {
    const handleAdd = () => {
        onChange([...ingredients, '']);
    };

    const handleRemove = (index: number) => {
        const updated = ingredients.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleChange = (index: number, value: string) => {
        const updated = [...ingredients];
        updated[index] = value;
        onChange(updated);
    };

    return (
        <VStack align="stretch" gap={{base: 3, md: 2}}>
            {ingredients.map((ingredient, index) => (
                <Box key={index} display="flex" gap={{base: 2, md: 2}} alignItems="center">
                    <Input
                        value={ingredient}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1} (e.g., 2 cups flour)`}
                        size={{base: "md", md: "md"}}
                    />
                    <IconButton
                        aria-label="Remove ingredient"
                        onClick={() => handleRemove(index)}
                        colorScheme="red"
                        variant="ghost"
                        size="md"
                        minW="44px"
                        minH="44px"
                    >
                        <AiOutlineDelete />
                    </IconButton>
                </Box>
            ))}
            <Button
                onClick={handleAdd}
                variant="outline"
                size={{base: "md", md: "sm"}}
                minH="44px"
            >
                <AiOutlinePlus /> Add Ingredient
            </Button>
        </VStack>
    );
};
