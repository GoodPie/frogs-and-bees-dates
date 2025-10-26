import {Box, HStack, Text, NumberInput} from '@chakra-ui/react';

interface TimeInputGroupProps {
    label: string;
    hours: number;
    minutes: number;
    onHoursChange: (value: number) => void;
    onMinutesChange: (value: number) => void;
}

/**
 * Reusable time input component for hours and minutes
 */
export const TimeInputGroup = ({label, hours, minutes, onHoursChange, onMinutesChange}: TimeInputGroupProps) => {
    return (
        <Box>
            <Text fontWeight="bold" mb={2}>{label}</Text>
            <HStack>
                <Box>
                    <Text fontSize="sm" mb={1}>Hours</Text>
                    <NumberInput.Root
                        value={hours.toString()}
                        onValueChange={(details) => onHoursChange(Number(details.value))}
                        min={0}
                    >
                        <NumberInput.Input/>
                    </NumberInput.Root>
                </Box>
                <Box>
                    <Text fontSize="sm" mb={1}>Minutes</Text>
                    <NumberInput.Root
                        value={minutes.toString()}
                        onValueChange={(details) => onMinutesChange(Number(details.value))}
                        min={0}
                        max={59}
                    >
                        <NumberInput.Input/>
                    </NumberInput.Root>
                </Box>
            </HStack>
        </Box>
    );
};
