/**
 * Error display component for recipe import
 * @module components/RecipeParseError
 */

import {
    Box,
    Button,
    HStack,
    Text,
    VStack,
    Code,
    useDisclosure,
} from '@chakra-ui/react';
import { AiOutlineWarning, AiOutlineReload, AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import type { ImportError } from '@/screens/recipe-management/types/errors';
import { getRecoverySuggestion } from '@/screens/recipe-management/types/errors';

export interface RecipeParseErrorProps {
    /** The error object from import state */
    error: ImportError;
    /** Formatted error message */
    errorMessage: string | null;
    /** Whether retry is possible */
    canRetry: boolean;
    /** Callback when user clicks retry */
    onRetry: () => void;
}

/**
 * Component to display error information for recipe import failures
 * Shows user-friendly error message and recovery suggestion
 * Includes collapsible technical details
 *
 * @example
 * ```tsx
 * <RecipeParseError
 *   error={importState.error}
 *   errorMessage={errorMsg}
 *   canRetry={true}
 *   onRetry={() => handleRetry()}
 * />
 * ```
 */
export const RecipeParseError = ({
    error,
    errorMessage,
    canRetry,
    onRetry,
}: RecipeParseErrorProps) => {
    const { open: showDetails, onOpen: openDetails, onClose: closeDetails } = useDisclosure();
    const recoverySuggestion = getRecoverySuggestion(error);

    return (
        <Box
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor="red.500"
            bg="red.50"
            _dark={{
                bg: 'red.900',
                borderColor: 'red.400',
            }}
        >
            <VStack align="stretch" gap={3}>
                {/* Error Header */}
                <HStack>
                    <AiOutlineWarning color="red" size={24} />
                    <Text fontWeight="bold" color="red.700" _dark={{ color: 'red.200' }}>
                        Failed to parse recipe
                    </Text>
                </HStack>

                {/* Error Message */}
                {errorMessage && (
                    <Box>
                        <Text fontSize="sm" color="red.600" _dark={{ color: 'red.300' }}>
                            {errorMessage}
                        </Text>
                    </Box>
                )}

                {/* Recovery Suggestion */}
                {recoverySuggestion && (
                    <Box
                        p={2}
                        borderRadius="md"
                        bg="orange.50"
                        _dark={{ bg: 'orange.900' }}
                        borderLeft="3px solid"
                        borderColor="orange.500"
                    >
                        <Text fontSize="sm" color="orange.700" _dark={{ color: 'orange.200' }}>
                            {recoverySuggestion}
                        </Text>
                    </Box>
                )}

                {/* Action Buttons */}
                <HStack gap={2} justify="flex-start">
                    {canRetry && (
                        <Button
                            colorScheme="red"
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                        >
                            <AiOutlineReload /> Retry
                        </Button>
                    )}

                    {/* Technical Details Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={showDetails ? closeDetails : openDetails}
                    >
                        {showDetails ? <AiOutlineUp /> : <AiOutlineDown />} {showDetails ? 'Hide' : 'Show'} Technical Details
                    </Button>
                </HStack>

                {/* Technical Details (Collapsible) */}
                {showDetails && (
                    <Box
                        p={3}
                        borderRadius="md"
                        bg="gray.100"
                        borderWidth="1px"
                        borderColor="gray.300"
                        _dark={{
                            bg: 'gray.800',
                            borderColor: 'gray.600',
                        }}
                    >
                        <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.700" _dark={{ color: 'gray.300' }}>
                            Error Details:
                        </Text>
                        <Code
                            display="block"
                            p={2}
                            borderRadius="sm"
                            bg="gray.200"
                            fontSize="xs"
                            whiteSpace="pre-wrap"
                            wordBreak="break-word"
                            color="gray.800"
                            _dark={{
                                bg: 'gray.700',
                                color: 'gray.100',
                            }}
                        >
                            {JSON.stringify(error, null, 2)}
                        </Code>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};
