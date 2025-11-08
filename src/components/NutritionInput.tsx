import { Box, Input, VStack, Text } from '@chakra-ui/react';
import type {IRecipeNutrition} from '@/types/recipe/Recipe';

interface NutritionInputProps {
    nutrition: IRecipeNutrition | undefined;
    onChange: (nutrition: IRecipeNutrition) => void;
}

/**
 * Component for entering nutritional information for a recipe
 */
export const NutritionInput = ({ nutrition, onChange }: NutritionInputProps) => {
    const handleChange = (field: keyof IRecipeNutrition, value: string) => {
        onChange({
            ...nutrition,
            [field]: value,
        });
    };

    const nutritionFields: { key: keyof IRecipeNutrition; label: string; placeholder: string }[] = [
        { key: 'servingSize', label: 'Serving Size', placeholder: '1 cup' },
        { key: 'calories', label: 'Calories', placeholder: '270 calories' },
        { key: 'carbohydrateContent', label: 'Carbohydrates', placeholder: '14g' },
        { key: 'proteinContent', label: 'Protein', placeholder: '3g' },
        { key: 'fatContent', label: 'Total Fat', placeholder: '12g' },
        { key: 'saturatedFatContent', label: 'Saturated Fat', placeholder: '7g' },
        { key: 'unsaturatedFatContent', label: 'Unsaturated Fat', placeholder: '2g' },
        { key: 'transFatContent', label: 'Trans Fat', placeholder: '0g' },
        { key: 'cholesterolContent', label: 'Cholesterol', placeholder: '30mg' },
        { key: 'sodiumContent', label: 'Sodium', placeholder: '110mg' },
        { key: 'fiberContent', label: 'Fiber', placeholder: '1g' },
        { key: 'sugarContent', label: 'Sugar', placeholder: '12g' },
    ];

    return (
        <VStack align="stretch" gap={3}>
            {nutritionFields.map(({ key, label, placeholder }) => (
                <Box key={key}>
                    <Text fontWeight="medium" mb={1} fontSize="sm">
                        {label}
                    </Text>
                    <Input
                        value={nutrition?.[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                    />
                </Box>
            ))}
        </VStack>
    );
};
