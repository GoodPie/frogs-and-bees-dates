import {
    Box,
    Button,
    Dialog,
    Heading,
    Input,
    Text,
    Textarea,
    VStack,
    HStack,
    Badge,
    Code,
    useDisclosure,
    Collapsible,
} from '@chakra-ui/react';
import {toaster} from "@/components/ui/toaster"
import {AiOutlineImport, AiOutlineClose, AiOutlineCheckCircle, AiOutlineWarning} from 'react-icons/ai';
import {executeRecaptchaV3} from '@/utils/recaptchaV3';
import {useRecipeImport} from '@/screens/recipe-management/hooks/useRecipeImport.ts';
import {getJsonLdExtractionInstructions} from '@/screens/recipe-management/utils/parsing/jsonLdParser.ts';
import {RecipeParseError} from './RecipeParseError';
import {IngredientParsingProgress} from './IngredientParsingProgress';
import {RecipeImportErrorBoundary} from './RecipeImportErrorBoundary';
import {LuChevronDown} from "react-icons/lu";

export interface RecipeImportProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal for importing recipes from JSON-LD
 */
export const RecipeImportModal = ({isOpen, onClose}: RecipeImportProps) => {
    const importState = useRecipeImport();

    const handleImport = () => {
        importState.importRecipe();
        onClose();
    };

    const handleClose = () => {
        // Check if there's complete parsed data that hasn't been imported
        const hasUnsavedData = importState.state.status === 'complete' &&
                               importState.state.recipe &&
                               importState.canImport;

        if (hasUnsavedData) {
            const shouldClose = window.confirm(
                'You have successfully parsed recipe data that has not been imported. ' +
                'If you close now, this data will be lost. Are you sure you want to close?'
            );

            if (!shouldClose) {
                return; // User cancelled, don't close
            }
        }

        importState.reset();
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={({open}) => !open && handleClose()} size={{base: "full", md: "xl"}}>
            <Dialog.Backdrop/>
            <Dialog.Positioner>
                <Dialog.Content maxH={{base: "100vh", md: "90vh"}} overflowY="auto">
                    <Dialog.Header>
                        <Heading size="lg">Import Recipe</Heading>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <AiOutlineClose/>
                            </Button>
                        </Dialog.CloseTrigger>
                    </Dialog.Header>

                    <Dialog.Body p={{base: 4, md: 6}}>
                        <VStack align="stretch" gap={{base: 3, md: 4}}>
                            {/* URL Input */}
                            <Box>
                                <Text fontWeight="bold" mb={2}>
                                    Recipe URL (Optional)
                                </Text>
                                <Input
                                    placeholder="https://example.com/recipe"
                                    value={importState.url}
                                    onChange={(e) => importState.setUrl(e.target.value)}
                                />
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    For your reference - not used for automatic import
                                </Text>
                            </Box>

                            {/* Instructions */}
                            <Box
                                p={{base: 3, md: 4}}
                                bg="blue.50"
                                borderRadius="md"
                                borderLeft="4px solid"
                                borderColor="blue.500"
                                _dark={{bg: 'blue.900', borderColor: 'blue.400'}}
                            >
                                <Collapsible.Root>
                                    <Collapsible.Trigger cursor="pointer"   >
                                        <HStack>
                                            <Collapsible.Indicator
                                                transition="transform 0.2s"
                                                _open={{transform: "rotate(180deg)"}}
                                            >
                                                <LuChevronDown/>
                                            </Collapsible.Indicator>
                                            <Text fontWeight="bold" fontSize={{base: "sm", md: "md"}}>
                                                How to extract recipe data
                                            </Text>

                                        </HStack>
                                    </Collapsible.Trigger>
                                    <Collapsible.Content>
                                        <Text fontSize={{base: "xs", md: "sm"}} whiteSpace="pre-line"
                                              fontFamily="monospace">
                                            {getJsonLdExtractionInstructions(importState.url || undefined)}
                                        </Text>
                                    </Collapsible.Content>
                                </Collapsible.Root>
                            </Box>

                            {/* JSON-LD Input */}
                            <Box>
                                <Text fontWeight="bold" mb={2}>
                                    Paste JSON-LD Data
                                </Text>
                                <Textarea
                                    placeholder='{"@context": "https://schema.org", "@type": "Recipe", ...}'
                                    value={importState.jsonLdText}
                                    onChange={(e) => importState.setJsonLdText(e.target.value)}
                                    minH={{base: "150px", md: "200px"}}
                                    fontFamily="monospace"
                                    fontSize={{base: "xs", md: "sm"}}
                                />
                            </Box>

                            {/* Parse Button */}
                            <Button
                                colorScheme="blue"
                                onClick={importState.parseJsonLd}
                                loading={importState.state.status === 'parsing-json'}
                                disabled={!importState.jsonLdText.trim() || importState.state.status === 'parsing-json'}
                                size={{base: "md", md: "md"}}
                                minH="44px"
                            >
                                Parse Recipe Data
                            </Button>

                            {/* Ingredient Parsing Progress */}
                            {importState.state.status === 'parsing-ingredients' && (
                                <IngredientParsingProgress
                                    current={importState.state.current}
                                    total={importState.state.total}
                                    canCancel={importState.canCancel}
                                    onCancel={importState.cancel}
                                />
                            )}

                            {/* Error Display */}
                            {importState.state.status === 'error' && (
                                <RecipeParseError
                                    error={importState.state.error}
                                    errorMessage={importState.errorMessage}
                                    canRetry={importState.canRetry}
                                    onRetry={importState.retry}
                                />
                            )}

                            {/* Success Results */}
                            {importState.state.status === 'complete' && importState.state.recipe && (
                                <Box
                                    p={4}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="green.500"
                                    bg="green.50"
                                    _dark={{
                                        bg: 'green.900',
                                    }}
                                >
                                    <VStack align="stretch" gap={3}>
                                        {/* Success Header */}
                                        <HStack>
                                            <AiOutlineCheckCircle color="green" size={24}/>
                                            <Text fontWeight="bold" color="green.700" _dark={{color: 'green.200'}}>
                                                Recipe parsed successfully!
                                            </Text>
                                        </HStack>

                                        {/* Warnings */}
                                        {importState.state.warnings && importState.state.warnings.length > 0 && (
                                            <Box>
                                                <HStack mb={1}>
                                                    <AiOutlineWarning color="orange"/>
                                                    <Text fontWeight="bold" fontSize="sm" color="orange.700"
                                                          _dark={{color: 'orange.200'}}>
                                                        Warnings:
                                                    </Text>
                                                </HStack>
                                                <VStack align="stretch" gap={1}>
                                                    {importState.state.warnings.map((warning, index) => (
                                                        <Text key={index} fontSize="sm" color="orange.600"
                                                              _dark={{color: 'orange.300'}}>
                                                            • {warning.message}
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Recipe Preview */}
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm" mb={2}>
                                                Recipe Preview:
                                            </Text>
                                            <VStack align="stretch" gap={2} fontSize="sm">
                                                <HStack>
                                                    <Text fontWeight="bold" minW="100px">Name:</Text>
                                                    <Text>{importState.state.recipe.name}</Text>
                                                </HStack>
                                                {importState.state.recipe.description && (
                                                    <HStack align="start">
                                                        <Text fontWeight="bold" minW="100px">Description:</Text>
                                                        <Text maxLines={2}>{importState.state.recipe.description}</Text>
                                                    </HStack>
                                                )}
                                                <HStack>
                                                    <Text fontWeight="bold" minW="100px">Ingredients:</Text>
                                                    <Badge colorScheme="blue">
                                                        {importState.state.recipe.recipeIngredient?.length || 0} items
                                                    </Badge>
                                                    {importState.state.recipe.ingredientParsingCompleted && (
                                                        <Badge colorScheme="green" variant="subtle">
                                                            ✓ Parsed
                                                        </Badge>
                                                    )}
                                                </HStack>
                                                <HStack>
                                                    <Text fontWeight="bold" minW="100px">Instructions:</Text>
                                                    <Badge colorScheme="green">
                                                        {importState.state.recipe.recipeInstructions?.length || 0} steps
                                                    </Badge>
                                                </HStack>
                                                {importState.state.recipe.prepTime && (
                                                    <HStack>
                                                        <Text fontWeight="bold" minW="100px">Prep Time:</Text>
                                                        <Code>{importState.state.recipe.prepTime}</Code>
                                                    </HStack>
                                                )}
                                                {importState.state.recipe.cookTime && (
                                                    <HStack>
                                                        <Text fontWeight="bold" minW="100px">Cook Time:</Text>
                                                        <Code>{importState.state.recipe.cookTime}</Code>
                                                    </HStack>
                                                )}
                                            </VStack>
                                        </Box>

                                        {/* Parsed Ingredients Preview */}
                                        {importState.state.recipe.parsedIngredients && (
                                            <Box mt={3}>
                                                <Text fontWeight="bold" fontSize="sm" mb={2}>
                                                    Parsed Ingredients
                                                    ({importState.state.recipe.parsedIngredients.length}):
                                                </Text>
                                                <VStack align="stretch" gap={1} maxH="200px" overflowY="auto" p={2}
                                                        bg="gray.50" _dark={{bg: 'gray.800'}} borderRadius="md">
                                                    {importState.state.recipe.parsedIngredients.map((ing, index) => (
                                                        <HStack key={index} justify="space-between" fontSize="sm">
                                                            <Text flex={1}>
                                                                {ing.metricQuantity && ing.metricUnit
                                                                    ? `${ing.metricQuantity} ${ing.metricUnit} ${ing.ingredientName}`
                                                                    : ing.originalText}
                                                                {ing.preparationNotes && ` (${ing.preparationNotes})`}
                                                            </Text>
                                                            {ing.requiresManualReview && (
                                                                <Badge colorScheme="orange" size="sm" variant="subtle">
                                                                    Review
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                                {importState.state.recipe.parsedIngredients.some(ing => ing.requiresManualReview) && (
                                                    <Text fontSize="xs" color="orange.600" _dark={{color: 'orange.300'}}
                                                          mt={1}>
                                                        <AiOutlineWarning
                                                            style={{display: 'inline', marginRight: '4px'}}/>
                                                        Some ingredients require manual review after import
                                                    </Text>
                                                )}
                                            </Box>
                                        )}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </Dialog.Body>

                    <Dialog.Footer p={{base: 4, md: 6}}>
                        <HStack justify="space-between" w="100%" gap={2} flexWrap={{base: "wrap", sm: "nowrap"}}>
                            <Button variant="ghost" onClick={handleClose} minH="44px" flex={{base: 1, sm: "0"}}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={handleImport}
                                disabled={!importState.canImport}
                                minH="44px"
                            >
                                <AiOutlineImport/> Import Recipe
                            </Button>
                        </HStack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};

/**
 * Button component to trigger recipe import
 */
export const RecipeImportButton = () => {
    const {open, onOpen, onClose} = useDisclosure();

    const handleOpen = async () => {
        const token = await executeRecaptchaV3('import_recipe');
        if (!token) {
            toaster.error({
                title: 'reCAPTCHA verification failed',
                description: 'Please try again.',
            });
            return;
        }
        onOpen();
    };

    return (
        <>
            <Button colorScheme="blue" onClick={handleOpen} variant="outline">
                <AiOutlineImport/> Import Recipe
            </Button>
            <RecipeImportErrorBoundary>
                <RecipeImportModal isOpen={open} onClose={onClose}/>
            </RecipeImportErrorBoundary>
        </>
    );
};
