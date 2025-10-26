import { Box, Button, IconButton, Textarea, VStack, Text } from '@chakra-ui/react';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';

interface InstructionInputProps {
    instructions: string[];
    onChange: (instructions: string[]) => void;
}

/**
 * Component for managing a dynamic list of recipe instructions
 */
export const InstructionInput = ({ instructions, onChange }: InstructionInputProps) => {
    const handleAdd = () => {
        onChange([...instructions, '']);
    };

    const handleRemove = (index: number) => {
        const updated = instructions.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleChange = (index: number, value: string) => {
        const updated = [...instructions];
        updated[index] = value;
        onChange(updated);
    };

    return (
        <VStack align="stretch" gap={{base: 4, md: 3}}>
            {instructions.map((instruction, index) => (
                <Box key={`step${index}`}>
                    <Box display="flex" alignItems="center" mb={2} gap={2}>
                        <Text fontWeight="medium">
                            Step {index + 1}
                        </Text>
                        <IconButton
                            aria-label="Remove instruction"
                            onClick={() => handleRemove(index)}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            minW="44px"
                            minH="44px"
                        >
                            <AiOutlineDelete />
                        </IconButton>
                    </Box>
                    <Textarea
                        value={instruction}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder={`Describe step ${index + 1}`}
                        rows={{base: 4, md: 3}}
                        size={{base: "md", md: "md"}}
                    />
                </Box>
            ))}
            <Button
                onClick={handleAdd}
                variant="outline"
                size={{base: "md", md: "sm"}}
                minH="44px"
            >
                <AiOutlinePlus /> Add Step
            </Button>
        </VStack>
    );
};
