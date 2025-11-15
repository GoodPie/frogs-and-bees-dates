import { Box, HStack, Button, Text, Badge, Input } from '@chakra-ui/react';
import type { YieldAdjustmentState, YieldValidationError } from '@/screens/recipe-management/types/Recipe';
import { YIELD_MIN_MULTIPLIER, YIELD_MAX_MULTIPLIER } from '@/screens/recipe-management/utils/yieldCalculations';

interface YieldAdjusterProps {
    /** Current yield adjustment state */
    yieldState: YieldAdjustmentState;

    /** Callback when user increments yield */
    onIncrement: () => void;

    /** Callback when user decrements yield */
    onDecrement: () => void;

    /** Callback when user resets to original yield */
    onReset: () => void;

    /** Callback when user types direct input */
    onDirectInput: (value: number) => void;

    /** Optional validation error to display */
    error?: YieldValidationError | null;
}

export function YieldAdjuster({
    yieldState,
    onIncrement,
    onDecrement,
    onReset,
    onDirectInput,
    error
}: YieldAdjusterProps) {
    const { currentYield, originalYield, isAdjusted, originalYieldString } = yieldState;

    const minYield = originalYield * YIELD_MIN_MULTIPLIER;
    const maxYield = originalYield * YIELD_MAX_MULTIPLIER;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseFloat(e.target.value);
        if (!isNaN(numValue)) {
            onDirectInput(numValue);
        }
    };

    return (
        <Box>
            <HStack gap={3} alignItems="center" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Text fontWeight="bold">Servings:</Text>

                <HStack gap={1}>
                    <Button
                        size="sm"
                        onClick={onDecrement}
                        aria-label="Decrease servings"
                        disabled={currentYield <= minYield}
                    >
                        −
                    </Button>

                    <Input
                        type="number"
                        value={currentYield}
                        onChange={handleInputChange}
                        min={minYield}
                        max={maxYield}
                        step={0.5}
                        width={{ base: '70px', md: '80px' }}
                        textAlign="center"
                        size="sm"
                    />

                    <Button
                        size="sm"
                        onClick={onIncrement}
                        aria-label="Increase servings"
                        disabled={currentYield >= maxYield}
                    >
                        +
                    </Button>
                </HStack>

                {isAdjusted && (
                    <>
                        <Badge colorScheme="blue" size="sm">Adjusted</Badge>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onReset}
                            aria-label="Reset to original servings"
                        >
                            Reset
                        </Button>
                    </>
                )}

                {originalYieldString && (
                    <Text fontSize="sm" color="gray.600">
                        (Original: {originalYieldString})
                    </Text>
                )}
            </HStack>

            {error && (
                <Text color="red.500" fontSize="sm" mt={2}>
                    {error.message}
                </Text>
            )}
        </Box>
    );
}
