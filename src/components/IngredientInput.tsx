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
        <VStack align="stretch" gap={2}>
            {ingredients.map((ingredient, index) => (
                <Box key={index} display="flex" gap={2}>
                    <Input
                        value={ingredient}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1} (e.g., 2 cups flour)`}
                    />
                    <IconButton
                        aria-label="Remove ingredient"
                        onClick={() => handleRemove(index)}
                        colorScheme="red"
                        variant="ghost"
                    >
                        <AiOutlineDelete />
                    </IconButton>
                </Box>
            ))}
            <Button
                leftIcon={<AiOutlinePlus />}
                onClick={handleAdd}
                variant="outline"
                size="sm"
            >
                Add Ingredient
            </Button>
        </VStack>
    );
};
