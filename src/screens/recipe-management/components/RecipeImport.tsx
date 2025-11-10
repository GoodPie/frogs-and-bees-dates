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
    Spinner,
    Alert,
} from '@chakra-ui/react';
import {AiOutlineImport, AiOutlineClose, AiOutlineCheckCircle, AiOutlineWarning} from 'react-icons/ai';
import {useRecipeImport} from '@/screens/recipe-management/hooks/useRecipeImport.ts';
import {getJsonLdExtractionInstructions} from '@/screens/recipe-management/utils/recipeParser.ts';
import {useNavigate} from 'react-router-dom';
import {ROUTES} from '@/routing/routes.ts';

export interface RecipeImportProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal for importing recipes from JSON-LD
 */
export const RecipeImportModal = ({isOpen, onClose}: RecipeImportProps) => {
    const navigate = useNavigate();
    const importState = useRecipeImport();

    const handleImport = () => {
        const recipe = importState.getParsedRecipe();
        if (recipe) {
            // Navigate to add recipe screen with imported data
            navigate(ROUTES.RECIPE_ADD, {state: {importedRecipe: recipe}});
            onClose();
            importState.reset();
        }
    };

    const handleClose = () => {
        importState.reset();
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={({open}) => !open && handleClose()} size={{base: "full", md: "xl"}}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content maxH={{base: "100vh", md: "90vh"}} overflowY="auto">
                    <Dialog.Header>
                        <Heading size="lg">Import Recipe</Heading>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <AiOutlineClose />
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
                                <Text fontWeight="bold" mb={2} fontSize={{base: "sm", md: "md"}}>
                                    How to extract recipe data:
                                </Text>
                                <Text fontSize={{base: "xs", md: "sm"}} whiteSpace="pre-line" fontFamily="monospace">
                                    {getJsonLdExtractionInstructions(importState.url || undefined)}
                                </Text>
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
                                loading={importState.parsing || importState.isParsing}
                                disabled={!importState.jsonLdText.trim()}
                                size={{base: "md", md: "md"}}
                                minH="44px"
                            >
                                Parse Recipe Data
                            </Button>

                            {/* Ingredient Parsing Status */}
                            {importState.isParsing && (
                                <Alert.Root status="info">
                                    <Spinner size="sm" mr={2} />
                                    <Alert.Content>
                                        <Alert.Title>Parsing ingredients...</Alert.Title>
                                        <Alert.Description>
                                            Converting measurements and structuring ingredient data
                                        </Alert.Description>
                                    </Alert.Content>
                                </Alert.Root>
                            )}

                            {/* Parse Results */}
                            {importState.parseResult && (
                                <Box
                                    p={4}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor={importState.parseResult.success ? 'green.500' : 'red.500'}
                                    bg={importState.parseResult.success ? 'green.50' : 'red.50'}
                                    _dark={{
                                        bg: importState.parseResult.success ? 'green.900' : 'red.900',
                                    }}
                                >
                                    <VStack align="stretch" gap={3}>
                                        {/* Success/Error Header */}
                                        <HStack>
                                            {importState.parseResult.success ? (
                                                <>
                                                    <AiOutlineCheckCircle color="green" size={24} />
                                                    <Text fontWeight="bold" color="green.700" _dark={{color: 'green.200'}}>
                                                        Recipe parsed successfully!
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <AiOutlineClose color="red" size={24} />
                                                    <Text fontWeight="bold" color="red.700" _dark={{color: 'red.200'}}>
                                                        Failed to parse recipe
                                                    </Text>
                                                </>
                                            )}
                                        </HStack>

                                        {/* Errors */}
                                        {importState.parseResult.errors.length > 0 && (
                                            <Box>
                                                <Text fontWeight="bold" fontSize="sm" mb={1} color="red.700" _dark={{color: 'red.200'}}>
                                                    Errors:
                                                </Text>
                                                <VStack align="stretch" gap={1}>
                                                    {importState.parseResult.errors.map((error, index) => (
                                                        <Text key={index} fontSize="sm" color="red.600" _dark={{color: 'red.300'}}>
                                                            • {error}
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Warnings */}
                                        {importState.parseResult.warnings.length > 0 && (
                                            <Box>
                                                <HStack mb={1}>
                                                    <AiOutlineWarning color="orange" />
                                                    <Text fontWeight="bold" fontSize="sm" color="orange.700" _dark={{color: 'orange.200'}}>
                                                        Warnings:
                                                    </Text>
                                                </HStack>
                                                <VStack align="stretch" gap={1}>
                                                    {importState.parseResult.warnings.map((warning, index) => (
                                                        <Text key={index} fontSize="sm" color="orange.600" _dark={{color: 'orange.300'}}>
                                                            • {warning}
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Recipe Preview */}
                                        {importState.parseResult.success && importState.parseResult.recipe && (
                                            <Box>
                                                <Text fontWeight="bold" fontSize="sm" mb={2}>
                                                    Recipe Preview:
                                                </Text>
                                                <VStack align="stretch" gap={2} fontSize="sm">
                                                    <HStack>
                                                        <Text fontWeight="bold" minW="100px">Name:</Text>
                                                        <Text>{importState.parseResult.recipe.name}</Text>
                                                    </HStack>
                                                    {importState.parseResult.recipe.description && (
                                                        <HStack align="start">
                                                            <Text fontWeight="bold" minW="100px">Description:</Text>
                                                            <Text maxLines={2}>{importState.parseResult.recipe.description}</Text>
                                                        </HStack>
                                                    )}
                                                    <HStack>
                                                        <Text fontWeight="bold" minW="100px">Ingredients:</Text>
                                                        <Badge colorScheme="blue">
                                                            {importState.parseResult.recipe.recipeIngredient?.length || 0} items
                                                        </Badge>
                                                        {importState.parseResult.recipe.ingredientParsingCompleted && (
                                                            <Badge colorScheme="green" variant="subtle">
                                                                ✓ Parsed
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                    <HStack>
                                                        <Text fontWeight="bold" minW="100px">Instructions:</Text>
                                                        <Badge colorScheme="green">
                                                            {importState.parseResult.recipe.recipeInstructions?.length || 0} steps
                                                        </Badge>
                                                    </HStack>
                                                    {importState.parseResult.recipe.prepTime && (
                                                        <HStack>
                                                            <Text fontWeight="bold" minW="100px">Prep Time:</Text>
                                                            <Code>{importState.parseResult.recipe.prepTime}</Code>
                                                        </HStack>
                                                    )}
                                                    {importState.parseResult.recipe.cookTime && (
                                                        <HStack>
                                                            <Text fontWeight="bold" minW="100px">Cook Time:</Text>
                                                            <Code>{importState.parseResult.recipe.cookTime}</Code>
                                                        </HStack>
                                                    )}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Parsed Ingredients Preview */}
                                        {importState.parseResult.success && importState.parseResult.recipe?.parsedIngredients && (
                                            <Box mt={3}>
                                                <Text fontWeight="bold" fontSize="sm" mb={2}>
                                                    Parsed Ingredients ({importState.parseResult.recipe.parsedIngredients.length}):
                                                </Text>
                                                <VStack align="stretch" gap={1} maxH="200px" overflowY="auto" p={2} bg="gray.50" _dark={{bg: 'gray.800'}} borderRadius="md">
                                                    {importState.parseResult.recipe.parsedIngredients.map((ing, index) => (
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
                                                {importState.parseResult.recipe.parsedIngredients.some(ing => ing.requiresManualReview) && (
                                                    <Text fontSize="xs" color="orange.600" _dark={{color: 'orange.300'}} mt={1}>
                                                        <AiOutlineWarning style={{display: 'inline', marginRight: '4px'}} />
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
                                disabled={!importState.parseResult?.success}
                                minH="44px"
                                flex={{base: 1, sm: "0"}}
                            >
                                <AiOutlineImport /> Import Recipe
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

    return (
        <>
            <Button colorScheme="blue" onClick={onOpen} variant="outline">
                <AiOutlineImport /> Import Recipe
            </Button>
            <RecipeImportModal isOpen={open} onClose={onClose} />
        </>
    );
};
