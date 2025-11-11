import {type ChangeEvent, useState} from 'react';
import { Box, Button, Input, Image, Text, VStack, HStack, RadioGroup } from '@chakra-ui/react';
import { useRecipeImage } from '@/screens/recipe-management/hooks/useRecipeImage.ts';

interface ImageUploadProps {
    imageUrl: string;
    onImageChange: (url: string, source: 'upload' | 'url') => void;
}

/**
 * Component for uploading recipe images or providing image URLs
 */
export const ImageUpload = ({ imageUrl, onImageChange }: ImageUploadProps) => {
    const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('url');
    const [urlInput, setUrlInput] = useState(imageUrl);
    const { uploadImage, validateUrl, loading, error } = useRecipeImage();

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadedUrl = await uploadImage(file);
        if (uploadedUrl) {
            onImageChange(uploadedUrl, 'upload');
        }
    };

    const handleUrlSubmit = () => {
        if (validateUrl(urlInput)) {
            onImageChange(urlInput, 'url');
        }
    };

    return (
        <VStack align="stretch" gap={4}>
            <RadioGroup.Root value={uploadMethod} onValueChange={(e) => setUploadMethod(e.value as 'upload' | 'url')}>
                <HStack gap={4}>
                    <RadioGroup.Item value="url">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemControl />
                        <RadioGroup.ItemText>Image URL</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="upload">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemControl />
                        <RadioGroup.ItemText>Upload Image</RadioGroup.ItemText>
                    </RadioGroup.Item>
                </HStack>
            </RadioGroup.Root>

            {uploadMethod === 'url' ? (
                <Box>
                    <HStack>
                        <Input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                        <Button onClick={handleUrlSubmit} colorScheme="blue">
                            Set URL
                        </Button>
                    </HStack>
                </Box>
            ) : (
                <Box>
                    <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    {loading && <Text fontSize="sm" color="gray.500" mt={1}>Uploading...</Text>}
                </Box>
            )}

            {error && (
                <Text color="red.500" fontSize="sm">
                    {error}
                </Text>
            )}

            {imageUrl && (
                <Box>
                    <Text fontWeight="medium" mb={2}>Preview:</Text>
                    <Image
                        src={imageUrl}
                        alt="Recipe preview"
                        maxHeight="300px"
                        objectFit="contain"
                        borderRadius="md"
                    />
                </Box>
            )}
        </VStack>
    );
};
