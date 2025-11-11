/**
 * Progress indicator for ingredient parsing
 * @module components/IngredientParsingProgress
 */

import {
    Box,
    Button,
    HStack,
    Text,
    VStack,
    Spinner,
} from '@chakra-ui/react';
import { AiOutlineClose } from 'react-icons/ai';
import { useMemo } from 'react';

export interface IngredientParsingProgressProps {
    /** Current ingredient being parsed (0-indexed) */
    current: number;
    /** Total ingredients to parse */
    total: number;
    /** Whether cancellation is allowed */
    canCancel: boolean;
    /** Callback when user cancels */
    onCancel: () => void;
}

/**
 * Component to display progress while parsing ingredients
 * Shows progress bar, percentage, and optional time remaining estimate
 *
 * @example
 * ```tsx
 * <IngredientParsingProgress
 *   current={5}
 *   total={15}
 *   canCancel={true}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 */
export const IngredientParsingProgress = ({
    current,
    total,
    canCancel,
    onCancel,
}: IngredientParsingProgressProps) => {
    // Calculate percentage
    const percentage = useMemo(() => {
        return total > 0 ? Math.round((current / total) * 100) : 0;
    }, [current, total]);

    return (
        <Box
            p={4}
            borderRadius="md"
            bg="blue.50"
            borderWidth="1px"
            borderColor="blue.200"
            _dark={{
                bg: 'blue.900',
                borderColor: 'blue.700',
            }}
        >
            <VStack align="stretch" gap={3}>
                {/* Header */}
                <HStack justify="space-between">
                    <HStack gap={2}>
                        <Spinner
                            size="sm"
                            color="blue.500"
                        />
                        <Text fontWeight="bold" color="blue.700" _dark={{ color: 'blue.200' }}>
                            Parsing ingredients...
                        </Text>
                    </HStack>
                    {canCancel && (
                        <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={onCancel}
                        >
                            <AiOutlineClose /> Cancel
                        </Button>
                    )}
                </HStack>

                {/* Progress Bar */}
                <Box>
                    <HStack justify="space-between" mb={1}>
                        <Text fontSize="xs" color="blue.600" _dark={{ color: 'blue.300' }}>
                            {current} of {total}
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
                            {percentage}%
                        </Text>
                    </HStack>
                    <Box
                        w="100%"
                        h="6px"
                        bg="blue.200"
                        borderRadius="full"
                        overflow="hidden"
                        _dark={{ bg: 'blue.700' }}
                    >
                        <Box
                            h="100%"
                            w={`${percentage}%`}
                            bg="blue.500"
                            transition="width 0.3s ease"
                            _dark={{ bg: 'blue.400' }}
                        />
                    </Box>
                </Box>

                {/* Status Message */}
                <Text
                    fontSize="xs"
                    color="blue.600"
                    _dark={{ color: 'blue.300' }}
                    textAlign="center"
                >
                    Converting measurements and structuring ingredient data...
                </Text>
            </VStack>
        </Box>
    );
};
