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
        <VStack align="stretch" gap={3}>
            {instructions.map((instruction, index) => (
                <Box key={`step${index}`}>
                    <Box display="flex" alignItems="center" mb={1}>
                        <Text fontWeight="medium" mr={2}>
                            Step {index + 1}
                        </Text>
                        <IconButton
                            aria-label="Remove instruction"
                            onClick={() => handleRemove(index)}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                        >
                            <AiOutlineDelete />
                        </IconButton>
                    </Box>
                    <Textarea
                        value={instruction}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder={`Describe step ${index + 1}`}
                        rows={3}
                    />
                </Box>
            ))}
            <Button
                onClick={handleAdd}
                variant="outline"
                size="sm"
            >
                <AiOutlinePlus /> Add Step
            </Button>
        </VStack>
    );
};
